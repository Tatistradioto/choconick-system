import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialView } from "@/components/financial/FinancialView";

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || format(new Date(), "yyyy-MM");
  const [y, m] = period.split("-").map(Number);
  const start = startOfMonth(new Date(y, m - 1));
  const end = endOfMonth(new Date(y, m - 1));

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, event_date, sale_price, total_cost, status, entry_paid, rest_paid, payment_entry, payment_rest")
    .gte("event_date", format(start, "yyyy-MM-dd"))
    .lte("event_date", format(end, "yyyy-MM-dd"));

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, description, amount, category, date")
    .gte("date", format(start, "yyyy-MM-dd"))
    .lte("date", format(end, "yyyy-MM-dd"));

  const realized = (events || []).filter((e) => e.status === "realizado");
  const revenue = realized.reduce((s, e) => s + (e.sale_price ?? 0), 0);
  const costs = realized.reduce((s, e) => s + (e.total_cost ?? 0), 0);
  const expensesTotal = (expenses || []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const profit = revenue - costs - expensesTotal;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const prevPeriod = format(subMonths(start, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-foreground/70 text-sm mt-0.5">Fluxo de caixa e lucratividade</p>
      </div>
      <FinancialView
        period={period}
        prevPeriod={prevPeriod}
        revenue={revenue}
        costs={costs}
        expensesTotal={expensesTotal}
        profit={profit}
        margin={margin}
        events={events || []}
        expenses={expenses || []}
      />
    </div>
  );
}
