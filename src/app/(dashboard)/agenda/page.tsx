import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { AgendaMonth } from "@/components/agenda/AgendaMonth";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const monthParam = params.month;
  const base = monthParam ? new Date(monthParam + "-01") : new Date();
  const start = startOfMonth(base);
  const end = endOfMonth(base);

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, event_date, event_time, guests_count, status, sale_price, clients(name)")
    .gte("event_date", format(start, "yyyy-MM-dd"))
    .lte("event_date", format(end, "yyyy-MM-dd"))
    .order("event_date")
    .order("event_time");

  const prevMonth = format(subMonths(start, 1), "yyyy-MM");
  const nextMonth = format(addMonths(start, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-foreground/70 text-sm mt-0.5">Eventos do mês</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/agenda?month=${prevMonth}`}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
          >
            ← Anterior
          </Link>
          <span className="px-4 py-2 font-mono text-foreground capitalize">
            {format(start, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Link
            href={`/agenda?month=${nextMonth}`}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
          >
            Próximo →
          </Link>
        </div>
      </div>
      <AgendaMonth
        start={start}
        end={end}
        events={(events as any[]) || []}
      />
    </div>
  );
}
