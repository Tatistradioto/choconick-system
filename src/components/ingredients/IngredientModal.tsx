"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Ingredient } from "@/types/database";

const CATEGORIES = ["frutas", "chocolate", "descartaveis", "outros"] as const;

type Props = {
  ingredient?: Ingredient | null;
  onClose: () => void;
  onSaved: () => void;
};

export function IngredientModal({ ingredient, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("frutas");
  const [unit, setUnit] = useState("kg");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [gramsPerPerson, setGramsPerPerson] = useState("");
  const [percentageMix, setPercentageMix] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setCategory(ingredient.category as typeof CATEGORIES[number]);
      setUnit(ingredient.unit);
      setPurchasePrice(String(ingredient.purchase_price ?? ""));
      setGramsPerPerson(ingredient.grams_per_person != null ? String(ingredient.grams_per_person) : "");
      setPercentageMix(ingredient.percentage_mix != null ? String(ingredient.percentage_mix) : "");
    }
  }, [ingredient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Não autorizado");
      setLoading(false);
      return;
    }
    // % na mistura só se aplica a frutas; chocolate usa só gramas/pessoa
    const mixValue = category === "frutas" && percentageMix ? parseFloat(percentageMix) : null;
    const payload = {
      user_id: user.id,
      name: name.trim(),
      category,
      unit: unit.trim() || "kg",
      purchase_price: parseFloat(purchasePrice) || 0,
      grams_per_person: gramsPerPerson ? parseFloat(gramsPerPerson) : null,
      percentage_mix: mixValue,
    };
    if (ingredient) {
      const { error } = await supabase.from("ingredients").update({
        name: payload.name,
        category: payload.category,
        unit: payload.unit,
        purchase_price: payload.purchase_price,
        grams_per_person: payload.grams_per_person,
        percentage_mix: payload.percentage_mix,
      }).eq("id", ingredient.id);
      if (error) {
        toast.error(formatIngredientError(error.message));
        setLoading(false);
        return;
      }
      toast.success("Ingrediente atualizado");
    } else {
      const { error } = await supabase.from("ingredients").insert(payload);
      if (error) {
        toast.error(formatIngredientError(error.message));
        setLoading(false);
        return;
      }
      toast.success("Ingrediente cadastrado");
    }
    onSaved();
    setLoading(false);
  }

  function formatIngredientError(msg: string) {
    if (msg.toLowerCase().includes("user_id") || msg.toLowerCase().includes("schema cache")) {
      return "Falta a coluna user_id na tabela ingredients. Execute no Supabase (SQL Editor) o arquivo supabase/migrations/add_user_id_to_ingredients.sql";
    }
    return msg;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            {ingredient ? "Editar ingrediente" : "Novo ingrediente"}
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-foreground/70 hover:text-foreground">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Unidade</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="kg, un, pct, L"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Preço de compra *</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">Gramas/pessoa</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={gramsPerPerson}
                onChange={(e) => setGramsPerPerson(e.target.value)}
                placeholder={category === "chocolate" ? "ex: 60" : ""}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
              />
              {category === "chocolate" && (
                <p className="text-xs text-foreground/60 mt-0.5">Usado no cálculo do orçamento (g por convidado)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">% na mistura</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={category === "frutas" ? percentageMix : ""}
                onChange={(e) => setPercentageMix(e.target.value)}
                placeholder={category !== "frutas" ? "—" : ""}
                disabled={category !== "frutas"}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
              />
              {category !== "frutas" && (
                <p className="text-xs text-foreground/60 mt-0.5">Apenas para categoria frutas</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-foreground">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50">
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
