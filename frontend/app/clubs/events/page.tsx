"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, List, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { fr } from "date-fns/locale";

import { EventCard } from "@/components/clubs/EventCard";
import { useClubEvents } from "@/hooks/useClubEvents";
import { cn } from "@/lib/utils";
import type { ClubEvent } from "@/lib/clubs-types";

export default function AllEventsPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, isLoading } = useClubEvents();

  // Group events by week for list view
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const groups: { label: string; events: ClubEvent[] }[] = [
      { label: "Cette semaine", events: [] },
      { label: "Semaine prochaine", events: [] },
      { label: "Plus tard", events: [] },
    ];

    const sorted = [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    const thisWeekEnd = new Date(now); thisWeekEnd.setDate(now.getDate() + (7 - now.getDay()));
    const nextWeekEnd = new Date(thisWeekEnd); nextWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    sorted.forEach((e) => {
      const d = new Date(e.starts_at);
      if (d <= thisWeekEnd) groups[0].events.push(e);
      else if (d <= nextWeekEnd) groups[1].events.push(e);
      else groups[2].events.push(e);
    });

    return groups.filter((g) => g.events.length > 0);
  }, [events]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    // Pad start
    const startDay = getDay(start);
    const paddedStart = Array.from({ length: startDay === 0 ? 6 : startDay - 1 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - (startDay === 0 ? 6 : startDay - 1) + i);
      return d;
    });
    return [...paddedStart, ...days];
  }, [currentMonth]);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.starts_at), day));

  return (
    <main className="relative min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.2),transparent_24%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.18),transparent_26%)]" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        <Link href="/clubs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Retour aux clubs
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-900">
              Événements
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tous les événements des clubs de l&apos;INPT
            </p>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 rounded-xl bg-white/60 border border-white/70 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition", viewMode === "list" ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-white/80")}
            >
              <List className="h-4 w-4" /> Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition", viewMode === "calendar" ? "bg-primary text-white shadow-md" : "text-slate-600 hover:bg-white/80")}
            >
              <CalendarDays className="h-4 w-4" /> Calendrier
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-[1.75rem] border border-white/70 bg-white/50" />)}
          </div>
        ) : viewMode === "list" ? (
          /* ── List view ── */
          <div className="space-y-8">
            {groupedEvents.map((group) => (
              <div key={group.label}>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.events.map((e) => <EventCard key={e.id} event={e} showClub />)}
                </div>
              </div>
            ))}
            {groupedEvents.length === 0 && (
              <div className="rounded-[2rem] border border-white/70 bg-white/80 p-12 text-center shadow-sm backdrop-blur-xl">
                <p className="text-4xl">📅</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">Aucun événement</h3>
                <p className="mt-1 text-sm text-slate-500">Pas d&apos;événements à afficher pour le moment.</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Calendar view ── */
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
            {/* Month nav */}
            <div className="mb-6 flex items-center justify-between">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-serif text-xl font-semibold capitalize text-slate-900">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 text-center">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="py-2 text-xs font-semibold text-slate-400">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] rounded-xl border p-1.5 transition",
                      inMonth ? "border-slate-100 bg-white/60" : "border-transparent bg-slate-50/30",
                      isToday(day) && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <span className={cn("text-xs font-medium", inMonth ? "text-slate-700" : "text-slate-300", isToday(day) && "text-primary font-semibold")}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div key={e.id} className="truncate rounded-md bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-slate-400">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
