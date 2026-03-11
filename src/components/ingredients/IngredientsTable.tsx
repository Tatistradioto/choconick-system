"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Ingredient } from "@/types/database";
import { Pencil, Trash2, Plus } from "lucide-react";
import { IngredientModal } from "./IngredientModal";

export function IngredientsTable({ initialIngredients }: { initialIngredients: Ingredient[] }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const filtered = ingredients.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  async function refresh() {
    const { data } = await supabase.from("ingredients").select("*").order("category").order("name");
    setIngredients(data || []);
  }

  async function handleToggleActive(ing: Ingredient) {
    const { error } = await supabase
      .from("ingredients")
      .update({ is_active: !ing.is_active })
      .eq("id", ing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(ing.is_active ? "Ingrediente desativado" : "Ingrediente ativado");
    refresh();
  }

  async function handleDelete(ing: Ingredient) {
    if (!confirm(`Excluir "${ing.name}"?`)) return;
    const { error } = await supabase.from("ingredients").delete().eq("id", ing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Excluído");
    refresh();
    setEditing(null);
  }

  function handleSaved() {
    refresh();
    setEditing(null);
    setOpenNew(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent max-w-xs"
        />
        <button
          type="button"
          onClick={() => setOpenNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Novo ingrediente
        </button>
      </div>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/70">
                <th className="p-3 font-medium">Nome</th>
                <th className="p-3 font-medium">Categoria</th>
                <th className="p-3 font-medium">Unidade</th>
                <th className="p-3 font-medium">Preço</th>
                <th className="p-3 font-medium">g/pessoa</th>
                <th className="p-3 font-medium">% mix</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr
                  key={i.id}
                  className={`border-b border-border hover:bg-background/50 ${!i.is_active ? "opacity-60" : ""}`}
                >
                  <td className="p-3 font-medium text-foreground">{i.name}</td>
                  <td className="p-3 text-foreground/90">{i.category}</td>
                  <td className="p-3 font-mono text-foreground/90">{i.unit}</td>
                  <td className="p-3 font-mono">R$ {(i.purchase_price ?? 0).toFixed(2)}</td>
                  <td className="p-3 font-mono">{i.grams_per_person ?? "—"}</td>
                  <td className="p-3 font-mono">{i.percentage_mix != null ? `${i.percentage_mix}%` : "—"}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(i)}
                      className={`px-2 py-0.5 rounded text-xs ${i.is_active ? "bg-green-500/20 text-green-400" : "bg-zinc-500/20 text-zinc-400"}`}
                    >
                      {i.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(i)}
                      className="p-1.5 rounded text-foreground/80 hover:bg-background"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(i)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <IngredientModal
          ingredient={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {openNew && (
        <IngredientModal
          onClose={() => setOpenNew(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
