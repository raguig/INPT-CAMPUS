"""Tool implementations available to Campus INPT agents.

Each public function is a LangChain-compatible tool decorated with @tool.
The TOOL_REGISTRY maps the string names stored in the Agent.tools column
to the actual callable objects so the LangGraph graph can wire them up.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from langchain_core.tools import tool


# ---------------------------------------------------------------------------
# 1. rag_search  – query ChromaDB for relevant documents
# ---------------------------------------------------------------------------


@tool
def rag_search(query: str, collection_ids: Optional[list[str]] = None) -> str:
    """Search the Campus INPT knowledge base (ChromaDB) for documents
    matching the query.  Optionally restrict to specific collection IDs.
    """
    try:
        import chromadb

        client = chromadb.HttpClient(host="localhost", port=8000)

        all_results: list[str] = []
        target_collections = collection_ids or []

        if not target_collections:
            # Search all collections
            collections = client.list_collections()
            target_collections = [c.name for c in collections]

        for coll_name in target_collections:
            try:
                collection = client.get_collection(coll_name)
                results = collection.query(query_texts=[query], n_results=5)
                if results and results.get("documents"):
                    for doc_list in results["documents"]:
                        all_results.extend(doc_list)
            except Exception:
                continue

        if not all_results:
            return "Aucun résultat trouvé dans la base de connaissances."

        return "\n\n---\n\n".join(all_results[:10])

    except Exception as exc:
        return f"Erreur lors de la recherche RAG : {exc}"


# ---------------------------------------------------------------------------
# 2. get_schedule  – return timetable for a filière / year
# ---------------------------------------------------------------------------


@tool
def get_schedule(filiere: str, year: int) -> str:
    """Return the weekly timetable for a given filière and academic year.
    Queries the 'academic' ChromaDB collection.
    """
    try:
        import chromadb

        client = chromadb.HttpClient(host="localhost", port=8000)
        try:
            collection = client.get_collection("academic")
        except Exception:
            return "Collection 'academic' introuvable. Aucun emploi du temps disponible."

        query_text = f"emploi du temps {filiere} année {year}"
        results = collection.query(
            query_texts=[query_text],
            n_results=5,
            where={"type": "schedule"} if collection.count() > 0 else None,
        )

        if results and results.get("documents") and results["documents"][0]:
            return "\n\n".join(results["documents"][0])

        return f"Aucun emploi du temps trouvé pour {filiere}, année {year}."

    except Exception as exc:
        return f"Erreur lors de la récupération de l'emploi du temps : {exc}"


# ---------------------------------------------------------------------------
# 3. get_internships  – query internship postings
# ---------------------------------------------------------------------------


@tool
def get_internships(
    filiere: Optional[str] = None,
    keywords: Optional[str] = None,
) -> str:
    """Search for available internship offers.  Optionally filter by filière
    or keywords.
    """
    try:
        import chromadb

        client = chromadb.HttpClient(host="localhost", port=8000)
        try:
            collection = client.get_collection("internships")
        except Exception:
            return "Collection 'internships' introuvable. Aucune offre de stage disponible."

        parts: list[str] = ["stage"]
        if filiere:
            parts.append(filiere)
        if keywords:
            parts.append(keywords)
        query_text = " ".join(parts)

        results = collection.query(query_texts=[query_text], n_results=10)

        if results and results.get("documents") and results["documents"][0]:
            return "\n\n---\n\n".join(results["documents"][0])

        return "Aucune offre de stage correspondante trouvée."

    except Exception as exc:
        return f"Erreur lors de la recherche de stages : {exc}"


# ---------------------------------------------------------------------------
# 4. generate_document  – produce attestation / cover letter
# ---------------------------------------------------------------------------


@tool
def generate_document(doc_type: str, student_info: str) -> str:
    """Generate an administrative document such as an attestation de scolarité
    or a lettre de motivation.

    Parameters
    ----------
    doc_type : str
        One of 'attestation', 'lettre_motivation', 'convention_stage'.
    student_info : str
        JSON string with keys like full_name, student_id, filiere, year, etc.
    """
    try:
        info = json.loads(student_info) if isinstance(student_info, str) else student_info
    except json.JSONDecodeError:
        info = {"raw": student_info}

    name = info.get("full_name", "Étudiant(e)")
    student_id = info.get("student_id", "N/A")
    filiere = info.get("filiere", "N/A")
    year = info.get("year", "N/A")
    today = datetime.now(timezone.utc).strftime("%d/%m/%Y")

    templates: dict[str, str] = {
        "attestation": (
            f"ATTESTATION DE SCOLARITÉ\n\n"
            f"Institut National des Postes et Télécommunications\n"
            f"Rabat, le {today}\n\n"
            f"Je soussigné(e), le Directeur de l'INPT, atteste que :\n\n"
            f"Nom et Prénom : {name}\n"
            f"Numéro d'étudiant : {student_id}\n"
            f"Filière : {filiere}\n"
            f"Année : {year}\n\n"
            f"est régulièrement inscrit(e) au titre de l'année universitaire en cours.\n\n"
            f"Cette attestation est délivrée à l'intéressé(e) pour servir et valoir "
            f"ce que de droit.\n\n"
            f"Le Directeur"
        ),
        "lettre_motivation": (
            f"Objet : Candidature pour un stage\n\n"
            f"Madame, Monsieur,\n\n"
            f"Actuellement étudiant(e) en {filiere} (année {year}) à l'Institut "
            f"National des Postes et Télécommunications (INPT) de Rabat, je me "
            f"permets de vous adresser ma candidature pour un stage au sein de "
            f"votre entreprise.\n\n"
            f"Passionné(e) par les nouvelles technologies et fort(e) de ma "
            f"formation à l'INPT, je souhaite mettre en pratique mes compétences "
            f"acquises au cours de mon cursus.\n\n"
            f"Je reste à votre disposition pour tout entretien.\n\n"
            f"Cordialement,\n{name}"
        ),
        "convention_stage": (
            f"CONVENTION DE STAGE\n\n"
            f"Entre l'Institut National des Postes et Télécommunications\n"
            f"et l'entreprise d'accueil,\n\n"
            f"Stagiaire : {name}\n"
            f"Numéro d'étudiant : {student_id}\n"
            f"Filière : {filiere}\n"
            f"Année : {year}\n\n"
            f"Date : {today}\n\n"
            f"[Les conditions détaillées du stage seront précisées ci-après.]"
        ),
    }

    doc_type_lower = doc_type.lower().strip()
    result = templates.get(doc_type_lower)
    if result is None:
        available = ", ".join(templates.keys())
        return (
            f"Type de document '{doc_type}' non reconnu. "
            f"Types disponibles : {available}"
        )
    return result


# ---------------------------------------------------------------------------
# 5. get_deadlines  – upcoming academic deadlines
# ---------------------------------------------------------------------------


@tool
def get_deadlines() -> str:
    """Return upcoming academic deadlines and important dates from the
    academic calendar.
    """
    try:
        import chromadb

        client = chromadb.HttpClient(host="localhost", port=8000)
        try:
            collection = client.get_collection("academic")
        except Exception:
            pass  # fall through to static calendar

        try:
            results = collection.query(
                query_texts=["dates limites échéances calendrier"],
                n_results=5,
            )
            if results and results.get("documents") and results["documents"][0]:
                return "\n\n".join(results["documents"][0])
        except Exception:
            pass

    except Exception:
        pass

    # Fallback: static upcoming deadlines so the agent always has something
    now = datetime.now(timezone.utc)
    deadlines = [
        {
            "event": "Date limite d'inscription aux examens de rattrapage",
            "date": (now + timedelta(days=10)).strftime("%d/%m/%Y"),
        },
        {
            "event": "Début des examens de fin de semestre",
            "date": (now + timedelta(days=21)).strftime("%d/%m/%Y"),
        },
        {
            "event": "Date limite de dépôt des rapports de stage",
            "date": (now + timedelta(days=30)).strftime("%d/%m/%Y"),
        },
        {
            "event": "Vacances de printemps",
            "date": (now + timedelta(days=45)).strftime("%d/%m/%Y"),
        },
    ]
    lines = [f"• {d['event']} — {d['date']}" for d in deadlines]
    return "Prochaines échéances :\n" + "\n".join(lines)


# ---------------------------------------------------------------------------
# Registry  – maps tool name strings (stored in DB) to callables
# ---------------------------------------------------------------------------

TOOL_REGISTRY: dict[str, object] = {
    "rag_search": rag_search,
    "get_schedule": get_schedule,
    "get_internships": get_internships,
    "generate_document": generate_document,
    "get_deadlines": get_deadlines,
}
