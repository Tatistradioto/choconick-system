import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { BudgetListTable } from "@/components/budget/BudgetListTable";

export default async function BudgetListPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, event_date, created_at, guests_count, sale_price, status, budget_number, clients(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-foreground/70 text-sm mt-0.5">Gerencie orçamentos e eventos</p>
        </div>
        <Link
          href="/budget/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Novo orçamento
        </Link>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {!events || events.length === 0 ? (
          <div className="p-8 text-center text-foreground/70">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum orçamento ainda.</p>
            <Link href="/budget/new" className="mt-2 inline-block text-accent hover:underline">
              Criar primeiro orçamento
            </Link>
          </div>
        ) : (
          <BudgetListTable events={(events as any[]) || []} />
        )}
      </div>
    </div>
  );
}
