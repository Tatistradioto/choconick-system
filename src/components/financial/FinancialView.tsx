"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type EventRow = {
  id: string;
  event_date: string | null;
  sale_price: number | null;
  total_cost: number | null;
  status: string;
};
type ExpenseRow = {
  id: string;
  description: string | null;
  amount: number | null;
  category: string | null;
  date: string | null;
};

export function FinancialView({
  period,
  prevPeriod,
  revenue,
  costs,
  expensesTotal,
  profit,
  margin,
  events,
  expenses,
}: {
  period: string;
  prevPeriod: string;
  revenue: number;
  costs: number;
  expensesTotal: number;
  profit: number;
  margin: number;
  events: EventRow[];
  expenses: ExpenseRow[];
}) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(period + "-01");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Não autorizado");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      description: desc || null,
      amount: parseFloat(amount) || 0,
      category: category || null,
      date: date || null,
    });
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success("Despesa registrada");
    setShowAddExpense(false);
    setDesc("");
    setAmount("");
    setCategory("");
    setDate(period + "-01");
    setSaving(false);
    window.location.reload();
  }

  const [y, m] = period.split("-").map(Number);
  const monthLabel = format(new Date(y, m - 1), "MMMM yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/financial?period=${prevPeriod}`}
          className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
        >
          ← Mês anterior
        </Link>
        <span className="font-mono text-foreground capitalize">{monthLabel}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Faturamento</p>
          <p className="font-mono text-lg text-foreground">
            R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Custo matéria-prima</p>
          <p className="font-mono text-lg text-foreground">
            R$ {costs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Despesas</p>
          <p className="font-mono text-lg text-foreground">
            R$ {expensesTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Lucro líquido</p>
          <p className="font-mono text-lg text-green-400">
            R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Margem real</p>
          <p className="font-mono text-lg text-accent">{margin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <h2 className="p-4 text-lg font-semibold text-foreground border-b border-border">
            Receitas (eventos realizados)
          </h2>
          {events.filter((e) => e.status === "realizado").length === 0 ? (
            <p className="p-4 text-foreground/70 text-sm">Nenhum evento realizado no período.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events
                .filter((e) => e.status === "realizado")
                .map((e) => (
                  <li key={e.id} className="p-4 flex justify-between items-center">
                    <Link href={`/budget/${e.id}`} className="text-accent hover:underline">
                      {e.event_date ? format(e.event_date, "dd/MM/yyyy", { locale: ptBR }) : ""}
                    </Link>
                    <span className="font-mono text-foreground">
                      R$ {(e.sale_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Despesas</h2>
            <button
              type="button"
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Nova despesa
            </button>
          </div>
          {expenses.length === 0 ? (
            <p className="p-4 text-foreground/70 text-sm">Nenhuma despesa no período.</p>
          ) : (
            <ul className="divide-y divide-border">
              {expenses.map((e) => (
                <li key={e.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-foreground">{e.description || "Sem descrição"}</p>
                    <p className="text-sm text-foreground/70">
                      {e.date ? format(e.date, "dd/MM/yyyy", { locale: ptBR }) : ""}
                      {e.category ? ` · ${e.category}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-red-400">
                    - R$ {(e.amount ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Nova despesa</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Descrição</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Valor</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Categoria</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Combustível, material..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg border border-border text-foreground">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50">
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
