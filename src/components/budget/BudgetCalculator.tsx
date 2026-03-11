"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  DEFAULT_DESCARTAVEIS,
  DEFAULT_OUTROS,
  DEFAULT_OPCIONAIS,
  DEFAULT_DESPESAS,
  type LineItem,
  type FruitLine,
  type OptionalItem,
  type OperationalExpense,
} from "./calculator-types";
import { BudgetCalculatorLeft } from "./BudgetCalculatorLeft";
import { BudgetCalculatorRight } from "./BudgetCalculatorRight";

const GRAMAS_FRUTAS_PRESETS = [150, 200, 250, 300];
const GRAMAS_CHOCOLATE_PRESETS = [40, 60, 80, 100];

export type EventBasics = {
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventAddress: string;
  eventCity: string;
};

export default function BudgetCalculator() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [eventBasics, setEventBasics] = useState<EventBasics>({
    clientId: null,
    clientName: "",
    clientPhone: "",
    eventDate: "",
    eventAddress: "",
    eventCity: "",
  });
  const [guests, setGuests] = useState(100);
  const [gramasFrutas, setGramasFrutas] = useState(200);
  const [gramasChocolate, setGramasChocolate] = useState(60);
  const [distanceKm, setDistanceKm] = useState(30);
  const [marginPercent, setMarginPercent] = useState(35);
  const [budgetNumber, setBudgetNumber] = useState("");
  const [proposalDate, setProposalDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });

  const [fruits, setFruits] = useState<FruitLine[]>([]);
  const [chocolatePricePerKg, setChocolatePricePerKg] = useState(100);
  const [descartaveis, setDescartaveis] = useState<LineItem[]>([]);
  const [outros, setOutros] = useState<LineItem[]>([]);
  const [opcionais, setOpcionais] = useState<OptionalItem[]>(DEFAULT_OPCIONAIS.map((o) => ({ ...o })));
  const [despesas, setDespesas] = useState<OperationalExpense[]>(DEFAULT_DESPESAS.map((d) => ({ ...d })));

  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await supabase.rpc("next_budget_number");
        const raw = res.data;
        const num = Array.isArray(raw) ? raw[0] : raw;
        if (!cancelled) setBudgetNumber(num != null ? String(num) : `ORC-${new Date().getFullYear()}-001`);
      } catch {
        if (!cancelled) setBudgetNumber(`ORC-${new Date().getFullYear()}-001`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: ing } = await supabase.from("ingredients").select("*").eq("is_active", true);
      const frutasIng = (ing || []).filter((i) => i.category === "frutas" && i.percentage_mix != null) as { id: string; name: string; percentage_mix: number; purchase_price: number }[];
      const chocolateIng = (ing || []).find((i) => i.category === "chocolate") as { purchase_price: number } | undefined;
      if (frutasIng.length) {
        const totalPct = frutasIng.reduce((s, i) => s + (i.percentage_mix || 0), 0);
        setFruits(
          frutasIng.map((f) => ({
            id: f.id,
            name: f.name,
            percentageMix: f.percentage_mix || 0,
            unitPrice: f.purchase_price,
            calculatedKg: 0,
            total: 0,
          }))
        );
      }
      if (chocolateIng) setChocolatePricePerKg(chocolateIng.purchase_price);
      setDescartaveis(
        DEFAULT_DESCARTAVEIS.map((d) => ({
          ...d,
          quantity: d.id === "cumbuca" ? Math.ceil(50 / 10) : d.id === "colherzinha" ? Math.ceil(50 / 50) : 1,
          quantityFromGuests: d.id === "cumbuca" ? (g) => Math.ceil(g / 10) : d.id === "colherzinha" ? (g) => Math.ceil(g / 50) : undefined,
        }))
      );
      setOutros(DEFAULT_OUTROS.map((o) => ({ ...o, quantity: 1 })));
      setLoading(false);
    })();
  }, [supabase]);

  const { costFrutas, costChocolate, costDescartaveis, costOutros, costOpcionais, costDespesas, totalCost, salePrice, profit, pricePerPerson, realMargin } = useMemo(() => {
    const totalGramsFrutas = guests * gramasFrutas;
    const totalGramsChocolate = guests * gramasChocolate;
    const totalPct = fruits.reduce((p, x) => p + x.percentageMix, 0) || 1;
    const sumFrutas = fruits.reduce((s, f) => s + (f.percentageMix / totalPct) * totalGramsFrutas / 1000 * f.unitPrice, 0);
    const kgChocolate = totalGramsChocolate / 1000;
    const sumChocolate = kgChocolate * chocolatePricePerKg;
    const sumDesc = descartaveis.filter((d) => d.enabled).reduce((s, d) => s + d.quantity * d.unitPrice, 0);
    const sumOutros = outros.filter((d) => d.enabled).reduce((s, d) => s + d.quantity * d.unitPrice, 0);
    const sumOpc = opcionais.filter((o) => o.enabled).reduce((s, o) => s + o.quantity * o.unitPrice, 0);
    const sumDesp = despesas.filter((d) => d.enabled).reduce((s, d) => {
      if (d.type === "fixed") return s + d.value;
      if (d.type === "per_km") return s + distanceKm * d.value;
      if (d.type === "per_unit") return s + (d.quantity ?? 0) * d.value;
      return s;
    }, 0);
    const total = sumFrutas + sumChocolate + sumDesc + sumOutros + sumDesp;
    const costWithOptionals = total + sumOpc;
    const saleRaw = marginPercent >= 100 ? costWithOptionals : costWithOptionals / (1 - marginPercent / 100);
    const salePrice = Math.ceil(saleRaw);
    const profit = salePrice - costWithOptionals;
    const realMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    return {
      costFrutas: sumFrutas,
      costChocolate: sumChocolate,
      costDescartaveis: sumDesc,
      costOutros: sumOutros,
      costOpcionais: sumOpc,
      costDespesas: sumDesp,
      totalCost: total,
      salePrice,
      profit,
      pricePerPerson: guests > 0 ? salePrice / guests : 0,
      realMargin,
    };
  }, [guests, gramasFrutas, gramasChocolate, fruits, chocolatePricePerKg, descartaveis, outros, opcionais, despesas, distanceKm, marginPercent]);

  const fruitsWithTotals = useMemo(() => {
    const totalPct = fruits.reduce((s, f) => s + f.percentageMix, 0) || 1;
    const totalG = guests * gramasFrutas;
    return fruits.map((f) => {
      const kg = (f.percentageMix / totalPct) * totalG / 1000;
      return { ...f, calculatedKg: kg, total: kg * f.unitPrice };
    });
  }, [fruits, guests, gramasFrutas]);

  const updateFruit = (id: string, field: "unitPrice" | "percentageMix", value: number) => {
    setFruits((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const updateDescartaveis = (id: string, updates: Partial<LineItem>) => {
    setDescartaveis((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };
  const updateOutros = (id: string, updates: Partial<LineItem>) => {
    setOutros((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };
  const updateOpcionais = (id: string, updates: Partial<OptionalItem>) => {
    setOpcionais((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };
  const updateDespesas = (id: string, updates: Partial<OperationalExpense>) => {
    setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  useEffect(() => {
    setDescartaveis((prev) =>
      prev.map((d) => {
        if (d.id === "cumbuca" && d.quantityFromGuests) return { ...d, quantity: d.quantityFromGuests(guests) };
        if (d.id === "colherzinha" && d.quantityFromGuests) return { ...d, quantity: d.quantityFromGuests(guests) };
        return d;
      })
    );
  }, [guests]);

  async function handleSave(andConfirm: boolean) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para continuar");
      setSaving(false);
      return;
    }
    let clientId = eventBasics.clientId;
    if (!clientId && eventBasics.clientName.trim()) {
      const { data: newClient } = await supabase.from("clients").insert({
        user_id: user.id,
        name: eventBasics.clientName.trim(),
        phone: eventBasics.clientPhone.trim() || null,
      }).select("id").single();
      if (newClient) clientId = newClient.id;
    }
    const totalCostVal = totalCost + (opcionais.filter((o) => o.enabled).reduce((s, o) => s + o.quantity * o.unitPrice, 0));
    const payload = {
      user_id: user.id,
      client_id: clientId,
      event_date: eventBasics.eventDate || null,
      event_address: eventBasics.eventAddress || null,
      event_city: eventBasics.eventCity || null,
      distance_km: distanceKm,
      guests_count: guests,
      status: "orcamento",
      total_cost: totalCostVal,
      profit_margin: marginPercent,
      sale_price: salePrice,
      price_per_person: pricePerPerson,
      payment_entry: salePrice * 0.5,
      payment_rest: salePrice * 0.5,
    };
    let budgetNum: string | null = null;
    try {
      const res = await supabase.rpc("next_budget_number");
      budgetNum = res.data as string | null;
    } catch {
      const y = new Date().getFullYear();
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", `${y}-01-01`);
      budgetNum = `ORC-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }
    const { data: event, error } = await supabase.from("events").insert({ ...payload, budget_number: budgetNum }).select("id").single();
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    const items: { event_id: string; ingredient_id: string | null; ingredient_name: string; quantity_kg: number; unit_price: number; total_price: number }[] = [];
    fruitsWithTotals.forEach((f) => items.push({ event_id: event.id, ingredient_id: f.id, ingredient_name: f.name, quantity_kg: f.calculatedKg, unit_price: f.unitPrice, total_price: f.total }));
    items.push({
      event_id: event.id,
      ingredient_id: null,
      ingredient_name: "Chocolate",
      quantity_kg: (guests * gramasChocolate) / 1000,
      unit_price: chocolatePricePerKg,
      total_price: costChocolate,
    });
    if (items.length) await supabase.from("event_items").insert(items);

    if (andConfirm) {
      let contractNum: string | null = null;
      try {
        const res = await supabase.rpc("next_contract_number");
        contractNum = res.data as string | null;
      } catch {
        const y = new Date().getFullYear();
        const { data: eventsThisYear } = await supabase.from("events").select("id").eq("user_id", user.id).gte("created_at", `${y}-01-01`);
        const eventIds = (eventsThisYear ?? []).map((e: { id: string }) => e.id);
        const { count } = eventIds.length ? await supabase.from("contracts").select("id", { count: "exact", head: true }).in("event_id", eventIds) : { count: 0 };
        contractNum = `CTR-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
      }
      await supabase.from("events").update({ status: "contrato_gerado", contract_number: contractNum }).eq("id", event.id);
      await supabase.from("contracts").insert({ event_id: event.id });
      toast.success("Orçamento salvo e contrato gerado.");
    } else {
      toast.success("Orçamento salvo.");
    }
    router.push(`/budget/${event.id}`);
    router.refresh();
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-foreground/70">
        Carregando…
      </div>
    );
  }

  const numeroOrcamento = budgetNumber || `ORC-${new Date().getFullYear()}-001`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-foreground">Orçamento #{numeroOrcamento}</span>
        <span className="text-foreground/50">·</span>
        <span className="text-foreground/70">📅</span>
        <input
          type="text"
          value={proposalDate}
          onChange={(e) => setProposalDate(e.target.value)}
          placeholder="DD/MM/AAAA"
          className="w-28 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
          title="Data do orçamento (editável)"
        />
      </div>
      <div className="p-4 bg-surface rounded-xl border border-border shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Cliente</label>
            <input
              type="text"
              value={eventBasics.clientName}
              onChange={(e) => setEventBasics((b) => ({ ...b, clientName: e.target.value }))}
              placeholder="Nome do cliente"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Telefone (WhatsApp)</label>
            <input
              type="tel"
              value={eventBasics.clientPhone}
              onChange={(e) => setEventBasics((b) => ({ ...b, clientPhone: e.target.value }))}
              placeholder="(62) 99999-9999"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Data</label>
            <input
              type="date"
              value={eventBasics.eventDate}
              onChange={(e) => setEventBasics((b) => ({ ...b, eventDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Endereço / Cidade</label>
            <input
              type="text"
              value={eventBasics.eventAddress + (eventBasics.eventCity ? `, ${eventBasics.eventCity}` : "")}
              onChange={(e) => {
                const v = e.target.value;
                const comma = v.indexOf(",");
                if (comma >= 0) {
                  setEventBasics((b) => ({ ...b, eventAddress: v.slice(0, comma).trim(), eventCity: v.slice(comma + 1).trim() }));
                } else {
                  setEventBasics((b) => ({ ...b, eventAddress: v }));
                }
              }}
              placeholder="Endereço, cidade"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Convidados</label>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">g Frutas/pessoa</label>
            <select
              value={gramasFrutas}
              onChange={(e) => setGramasFrutas(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              {GRAMAS_FRUTAS_PRESETS.map((g) => (
                <option key={g} value={g}>{g}g</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">g Chocolate/pessoa</label>
            <select
              value={gramasChocolate}
              onChange={(e) => setGramasChocolate(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              {GRAMAS_CHOCOLATE_PRESETS.map((g) => (
                <option key={g} value={g}>{g}g</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground/70 mb-1">Distância (km)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 overflow-x-auto">
          <BudgetCalculatorLeft
            fruitsWithTotals={fruitsWithTotals}
            updateFruit={updateFruit}
            guests={guests}
            gramasChocolate={gramasChocolate}
            chocolatePricePerKg={chocolatePricePerKg}
            setChocolatePricePerKg={setChocolatePricePerKg}
            descartaveis={descartaveis}
            updateDescartaveis={updateDescartaveis}
            outros={outros}
            updateOutros={updateOutros}
            opcionais={opcionais}
            updateOpcionais={updateOpcionais}
            despesas={despesas}
            updateDespesas={updateDespesas}
            distanceKm={distanceKm}
          />
        </div>
        <div className="lg:col-span-1">
          <BudgetCalculatorRight
            marginPercent={marginPercent}
            setMarginPercent={setMarginPercent}
            costFrutas={costFrutas}
            costChocolate={costChocolate}
            costDescartaveis={costDescartaveis}
            costOutros={costOutros}
            costOpcionais={costOpcionais}
            costDespesas={costDespesas}
            totalCost={totalCost}
            salePrice={salePrice}
            profit={profit}
            pricePerPerson={pricePerPerson}
            guests={guests}
            gramasFrutas={gramasFrutas}
            gramasChocolate={gramasChocolate}
            distanceKm={distanceKm}
            realMargin={realMargin}
            onSave={handleSave}
            saving={saving}
            clientPhone={eventBasics.clientPhone}
            clientName={eventBasics.clientName}
            eventId={null}
            eventDate={eventBasics.eventDate || undefined}
            numeroOrcamento={numeroOrcamento}
            dataOrcamento={proposalDate}
          />
        </div>
      </div>
    </div>
  );
}
