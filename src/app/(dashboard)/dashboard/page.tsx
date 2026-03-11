import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { DollarSign, Users, FileText, Calendar } from "lucide-react";
import { SeedOnFirstLoad } from "@/components/SeedOnFirstLoad";
import { RevenueChart } from "@/components/dashboard/RevenueChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const { data: events } = await supabase
    .from("events")
    .select("id, sale_price, guests_count, event_date, status, clients(name)")
    .order("event_date", { ascending: true });

  const realizedThisMonth = (events || []).filter(
    (e) => e.status === "realizado" && e.event_date && e.event_date >= startOfMonth.toISOString().slice(0, 10) && e.event_date <= endOfMonth.toISOString().slice(0, 10)
  );
  const confirmedNext30 = (events || []).filter(
    (e) => (e.status === "contrato_gerado" || e.status === "realizado") && e.event_date && e.event_date >= now.toISOString().slice(0, 10) && e.event_date <= in30Days.toISOString().slice(0, 10)
  );
  const pending = (events || []).filter((e) => e.status === "orcamento");
  const nextEvents = (events || [])
    .filter((e) => e.event_date && e.event_date >= now.toISOString().slice(0, 10))
    .slice(0, 5);

  const revenueMonth = realizedThisMonth.reduce((s, e) => s + (e.sale_price || 0), 0);
  const totalGuests = realizedThisMonth.reduce((s, e) => s + (e.guests_count || 0), 0);
  const ticketMedio = totalGuests > 0 ? revenueMonth / totalGuests : 0;

  const last6Months: { month: string; faturamento: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const monthEvents = (events || []).filter(
      (e) => e.status === "realizado" && e.event_date && e.event_date >= start.toISOString().slice(0, 10) && e.event_date <= end.toISOString().slice(0, 10)
    );
    last6Months.push({
      month: format(d, "MMM", { locale: ptBR }),
      faturamento: monthEvents.reduce((s, e) => s + (e.sale_price || 0), 0),
    });
  }

  return (
    <div className="space-y-8">
      <SeedOnFirstLoad />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-foreground/70 text-sm mt-0.5">Visão geral do negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Faturamento do mês"
          value={revenueMonth}
          format="currency"
          icon={DollarSign}
        />
        <Card
          title="Eventos confirmados (30 dias)"
          value={confirmedNext30.length}
          format="number"
          icon={Calendar}
        />
        <Card
          title="Ticket médio/pessoa"
          value={ticketMedio}
          format="currency"
          icon={Users}
        />
        <Card
          title="Orçamentos pendentes"
          value={pending.length}
          format="number"
          icon={FileText}
        />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Faturamento últimos 6 meses
        </h2>
        <RevenueChart data={last6Months} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Próximos eventos</h2>
          <Link href="/agenda" className="text-sm text-accent hover:underline">
            Ver agenda
          </Link>
        </div>
        {nextEvents.length === 0 ? (
          <p className="text-foreground/60 text-sm">Nenhum evento agendado</p>
        ) : (
          <ul className="space-y-2">
            {nextEvents.map((evt: { id: string; event_date: string | null; event_time?: string | null; guests_count: number; sale_price: number | null; status: string; clients: { name: string | null } | { name: string | null }[] | null }) => (
              <li
                key={evt.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {(evt.clients as { name: string } | null)?.name || "Sem cliente"}
                  </span>
                  <span className="text-foreground/70 text-sm ml-2">
                    {evt.event_date ? format(evt.event_date, "dd/MM/yyyy", { locale: ptBR }) : ""}
                    {evt.event_time ? ` ${String(evt.event_time).slice(0, 5)}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground/70">{evt.guests_count} convidados</span>
                  <span className="font-mono text-foreground">
                    R$ {(evt.sale_price || 0).toLocaleString("pt-BR")}
                  </span>
                  <span
                    className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${evt.status === "contrato_gerado" ? "bg-blue-500/20 text-blue-400" : ""}
                      ${evt.status === "realizado" ? "bg-green-500/20 text-green-400" : ""}
                      ${evt.status === "orcamento" ? "bg-amber-500/20 text-amber-400" : ""}
                      ${evt.status === "cancelado" ? "bg-red-500/20 text-red-400" : ""}
                    `}
                  >
                    {evt.status === "orcamento" ? "Orçamento" : evt.status === "contrato_gerado" ? "Contrato Gerado" : evt.status === "realizado" ? "Realizado" : evt.status === "cancelado" ? "Cancelado" : evt.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  format,
  icon: Icon,
}: {
  title: string;
  value: number;
  format: "currency" | "number";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-foreground/70">{title}</span>
        <Icon className="w-5 h-5 text-accent/80" />
      </div>
      <p className="text-xl font-mono font-semibold text-foreground">
        {format === "currency"
          ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : value}
      </p>
    </div>
  );
}
