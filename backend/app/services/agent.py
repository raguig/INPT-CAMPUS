"""LangGraph ReAct agent builder & streaming runner.

This module exposes:
    build_agent_graph(agent)  – returns a compiled LangGraph StateGraph
    run_agent_stream(agent, query, session)  – async generator that yields SSE
                                                dicts and persists the run.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_mistralai import ChatMistralAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode
from sqlmodel import Session
from typing_extensions import TypedDict

from app.models.agent import Agent, AgentRun, AgentStep
from app.services.tools import TOOL_REGISTRY


# ---------------------------------------------------------------------------
# LLM singleton
# ---------------------------------------------------------------------------


def _get_llm() -> ChatMistralAI:
    """Return the shared ChatMistralAI LLM instance."""
    return ChatMistralAI(
        model=os.getenv("LLM_MODEL", "mistral-small-latest"),
        temperature=float(os.getenv("LLM_TEMPERATURE", "0.3")),
        streaming=True,
        api_key=os.getenv("MISTRAL_API_KEY", ""),
    )


# ---------------------------------------------------------------------------
# Graph state schema
# ---------------------------------------------------------------------------


class AgentState(TypedDict):
    messages: Sequence[BaseMessage]


# ---------------------------------------------------------------------------
# Build a LangGraph for a given Agent configuration
# ---------------------------------------------------------------------------


def build_agent_graph(agent: Agent):
    """Compile a LangGraph ReAct-style graph for *agent*.

    The graph has two nodes:
      • **agent_node** – calls the LLM with bound tools
      • **tools**      – executes tool calls
    """

    # Resolve tool objects from stored names
    tool_names: list[str] = agent.get_tools()
    tools = [TOOL_REGISTRY[name] for name in tool_names if name in TOOL_REGISTRY]

    llm = _get_llm()

    if tools:
        llm_with_tools = llm.bind_tools(tools)
    else:
        llm_with_tools = llm

    # --- node functions ---

    def agent_node(state: AgentState) -> dict:
        messages = list(state["messages"])
        response = llm_with_tools.invoke(messages)
        return {"messages": messages + [response]}

    def should_continue(state: AgentState) -> str:
        last = state["messages"][-1]
        if isinstance(last, AIMessage) and last.tool_calls:
            return "tools"
        return END

    # --- assemble graph ---

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)

    if tools:
        tool_node = ToolNode(tools)
        graph.add_node("tools", tool_node)
        graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
        graph.add_edge("tools", "agent")
    else:
        graph.add_edge("agent", END)

    graph.set_entry_point("agent")
    return graph.compile()


# ---------------------------------------------------------------------------
# Streaming runner  –  yields SSE-formatted dict events
# ---------------------------------------------------------------------------


async def run_agent_stream(
    agent: Agent,
    query: str,
    session: Session,
    user_id: int | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """Run the agent graph and yield SSE-compatible dicts for each step.

    Events emitted:
        {"type": "thought",      "content": "..."}
        {"type": "tool_call",    "tool": "...", "input": "..."}
        {"type": "tool_result",  "content": "..."}
        {"type": "token",        "content": "..."}
        {"type": "done",         "run_id": <int>}
    """

    # Persist the run record
    run = AgentRun(
        agent_id=agent.id,
        user_id=user_id,
        query=query,
        status="running",
    )
    session.add(run)
    session.commit()
    session.refresh(run)

    step_order = 0

    def _save_step(
        step_type: str,
        content: str = "",
        tool_name: str | None = None,
        tool_input: str | None = None,
    ) -> None:
        nonlocal step_order
        step_order += 1
        step = AgentStep(
            run_id=run.id,
            step_order=step_order,
            step_type=step_type,
            content=content,
            tool_name=tool_name,
            tool_input=tool_input,
        )
        session.add(step)
        session.commit()

    try:
        # Build the system prompt
        system_msg_content = agent.system_prompt or (
            "Tu es un assistant intelligent du Campus INPT. "
            "Réponds en français de manière utile et concise."
        )

        messages: list[BaseMessage] = [
            HumanMessage(content=f"[SYSTEM] {system_msg_content}"),
            HumanMessage(content=query),
        ]

        graph = build_agent_graph(agent)

        # Stream through the graph
        final_answer = ""
        async for event in graph.astream(
            {"messages": messages},
            stream_mode="updates",
        ):
            for node_name, node_output in event.items():
                if node_name == "agent":
                    new_messages = node_output.get("messages", [])
                    for msg in new_messages:
                        if isinstance(msg, AIMessage):
                            # Tool calls
                            if msg.tool_calls:
                                for tc in msg.tool_calls:
                                    thought_event = {
                                        "type": "thought",
                                        "content": f"Je vais utiliser l'outil '{tc['name']}' pour répondre.",
                                    }
                                    _save_step("thought", thought_event["content"])
                                    yield thought_event

                                    tool_input_str = json.dumps(tc.get("args", {}), ensure_ascii=False)
                                    tc_event = {
                                        "type": "tool_call",
                                        "tool": tc["name"],
                                        "input": tool_input_str,
                                    }
                                    _save_step(
                                        "tool_call",
                                        content="",
                                        tool_name=tc["name"],
                                        tool_input=tool_input_str,
                                    )
                                    yield tc_event
                            else:
                                # Final (or intermediate) textual response
                                text = msg.content or ""
                                if text:
                                    final_answer = text
                                    token_event = {
                                        "type": "token",
                                        "content": text,
                                    }
                                    _save_step("token", text)
                                    yield token_event

                elif node_name == "tools":
                    new_messages = node_output.get("messages", [])
                    for msg in new_messages:
                        if isinstance(msg, ToolMessage):
                            tr_event = {
                                "type": "tool_result",
                                "content": msg.content or "",
                            }
                            _save_step(
                                "tool_result",
                                content=msg.content or "",
                                tool_name=msg.name if hasattr(msg, "name") else None,
                            )
                            yield tr_event

        # Mark run as completed
        run.final_answer = final_answer
        run.status = "completed"
        run.finished_at = datetime.now(timezone.utc)
        session.add(run)
        session.commit()

        yield {"type": "done", "run_id": run.id}

    except Exception as exc:
        run.status = "failed"
        run.final_answer = f"Erreur : {exc}"
        run.finished_at = datetime.now(timezone.utc)
        session.add(run)
        session.commit()

        yield {"type": "error", "content": str(exc)}
        yield {"type": "done", "run_id": run.id}
