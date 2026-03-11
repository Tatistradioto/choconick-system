"use client";

import { format, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

type EventRow = {
  id: string;
  event_date: string | null;
  event_time: string | null;
  guests_count: number;
  status: string;
  sale_price: number | null;
  clients: { name: string } | null;
};

export function AgendaMonth({
  start,
  end,
  events,
}: {
  start: Date;
  end: Date;
  events: EventRow[];
}) {
  const days = eachDayOfInterval({ start, end });
  const firstDay = days[0].getDay();
  const padding = firstDay === 0 ? 6 : firstDay - 1;

  function getEventsForDay(date: Date) {
    const d = format(date, "yyyy-MM-dd");
    return events.filter((e) => e.event_date === d);
  }

  const statusColor: Record<string, string> = {
    orcamento: "bg-amber-500/30 border-amber-500/50",
    contrato_gerado: "bg-blue-500/30 border-blue-500/50",
    realizado: "bg-green-500/30 border-green-500/50",
    cancelado: "bg-red-500/20 border-red-500/50",
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 text-center text-sm text-foreground/70 border-b border-border">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="p-2 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[400px]">
        {Array.from({ length: padding }, (_, i) => (
          <div key={`pad-${i}`} className="p-2 border-b border-r border-border min-h-[100px]" />
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`p-2 border-b border-r border-border min-h-[100px] ${isSameMonth(day, start) ? "" : "bg-background/30"}`}
            >
              <span
                className={`
                  inline-block w-7 h-7 rounded-full text-center leading-7 text-sm
                  ${isToday(day) ? "bg-accent text-white font-semibold" : "text-foreground"}
                `}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.map((evt) => (
                  <Link
                    key={evt.id}
                    href={`/budget/${evt.id}`}
                    className={`
                      block text-xs rounded px-2 py-1 border truncate
                      ${statusColor[evt.status] || "bg-surface border-border"}
                      hover:opacity-90
                    `}
                    title={`${(evt.clients as { name: string } | null)?.name || "Evento"} · ${evt.event_time ? String(evt.event_time).slice(0, 5) : ""} · ${evt.guests_count} conv.`}
                  >
                    {(evt.clients as { name: string } | null)?.name || "Sem nome"}
                    {evt.event_time ? ` ${String(evt.event_time).slice(0, 5)}` : ""}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
