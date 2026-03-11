"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Step1EventData } from "./Step1EventData";
import { Step2Costs } from "./Step2Costs";
import { Step3Payment } from "./Step3Payment";
import { Step4Review } from "./Step4Review";
import type { Ingredient } from "@/types/database";
import { initialDescartaveis, initialOutros } from "./initialItems";

export type WizardEventData = {
  clientId: string | null;
  clientName: string;
  eventDate: string;
  eventTime: string;
  eventAddress: string;
  eventCity: string;
  distanceKm: number;
  guestsCount: number;
};

export type CostRow = {
  ingredientId: string | null;
  name: string;
  category: string;
  quantityKg: number;
  unitPrice: number;
  totalPrice: number;
  isFixed: boolean; // transport or fixed cost line
};

export type PaymentData = {
  entryPercent: number;
  entryValue: number;
  restDate: string;
  paymentMethod: string;
};

const STEPS = ["Dados do evento", "Custos", "Pagamento", "Revisão"];

const GRAMAS_FRUTAS_POR_PESSOA = 200;

export function BudgetWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState<WizardEventData>({
    clientId: null,
    clientName: "",
    eventDate: "",
    eventTime: "",
    eventAddress: "",
    eventCity: "",
    distanceKm: 30,
    guestsCount: 100,
  });
  const [costRows, setCostRows] = useState<CostRow[]>([]);
  const [margin, setMargin] = useState(35);
  const [salePriceOverride, setSalePriceOverride] = useState<number | null>(null);
  const [payment, setPayment] = useState<PaymentData>({
    entryPercent: 50,
    entryValue: 0,
    restDate: "",
    paymentMethod: "PIX",
  });
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [fixedCosts, setFixedCosts] = useState<{ id: string; name: string; value: number }[]>([]);
  const [settings, setSettings] = useState<{ price_per_km: number; default_profit_margin: number }>({
    price_per_km: 2.5,
    default_profit_margin: 35,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const [ingRes, fixRes, setRes] = await Promise.all([
        supabase.from("ingredients").select("*").eq("is_active", true),
        supabase.from("fixed_costs").select("id, name, value").eq("is_active", true),
        supabase.from("settings").select("price_per_km, default_profit_margin").single(),
      ]);
      if (ingRes.data) setIngredients(ingRes.data as Ingredient[]);
      if (fixRes.data) setFixedCosts(fixRes.data as { id: string; name: string; value: number }[]);
      if (setRes.data) setSettings(setRes.data as { price_per_km: number; default_profit_margin: number });
      setLoading(false);
    })();
  }, [supabase]);

  useEffect(() => {
    if (loading || step !== 2) return;
    const guests = eventData.guestsCount || 1;
    const pricePerKm = settings.price_per_km ?? 2.5;
    const rows: CostRow[] = [];

    // FRUTAS — usa percentage_mix e GRAMAS_FRUTAS_POR_PESSOA
    const fruits = ingredients.filter(
      (i) => i.category === "frutas" && i.percentage_mix != null
    ) as (Ingredient & { percentage_mix: number | null })[];
    const totalKgFrutas = (GRAMAS_FRUTAS_POR_PESSOA * guests) / 1000;
    for (const ing of fruits) {
      const pct = (ing.percentage_mix || 0) / 100;
      const kg = pct * totalKgFrutas;
      const total = kg * ing.purchase_price;
      rows.push({
        ingredientId: ing.id,
        name: ing.name,
        category: ing.category,
        quantityKg: Math.round(kg * 1000) / 1000,
        unitPrice: ing.purchase_price,
        totalPrice: Math.round(total * 100) / 100,
        isFixed: false,
      });
    }

    // CHOCOLATE — mantém cálculo em g/pessoa do ingrediente
    const chocolate = ingredients.find((i) => i.category === "chocolate");
    if (chocolate && chocolate.grams_per_person) {
      const kg = (chocolate.grams_per_person * guests) / 1000;
      rows.push({
        ingredientId: chocolate.id,
        name: chocolate.name,
        category: chocolate.category,
        quantityKg: Math.round(kg * 1000) / 1000,
        unitPrice: chocolate.purchase_price,
        totalPrice: Math.round(kg * chocolate.purchase_price * 100) / 100,
        isFixed: false,
      });
    }

    // DESCARTÁVEIS — usa valores do initialItems.ts
    for (const d of initialDescartaveis) {
      const qtyBase = d.qtdPorPessoa != null ? guests * d.qtdPorPessoa : d.qty;
      const qty = Math.round(qtyBase * 1000) / 1000;
      const total = qty * d.price;
      rows.push({
        ingredientId: null,
        name: d.name,
        category: "descartaveis",
        quantityKg: qty,
        unitPrice: d.price,
        totalPrice: Math.round(total * 100) / 100,
        isFixed: false,
      });
    }

    // OUTROS — usa valores do initialItems.ts
    for (const o of initialOutros) {
      const qty = Math.round(o.qty * 1000) / 1000;
      const total = qty * o.price;
      rows.push({
        ingredientId: null,
        name: o.name,
        category: "outros",
        quantityKg: qty,
        unitPrice: o.price,
        totalPrice: Math.round(total * 100) / 100,
        isFixed: false,
      });
    }

    // TRANSPORTE
    const transportCost = eventData.distanceKm * pricePerKm;
    rows.push({
      ingredientId: null,
      name: "Transporte",
      category: "transport",
      quantityKg: eventData.distanceKm,
      unitPrice: pricePerKm,
      totalPrice: Math.round(transportCost * 100) / 100,
      isFixed: true,
    });

    // CUSTOS FIXOS CADASTRADOS
    for (const fc of fixedCosts) {
      rows.push({
        ingredientId: null,
        name: fc.name,
        category: "fixed",
        quantityKg: 1,
        unitPrice: fc.value,
        totalPrice: fc.value,
        isFixed: true,
      });
    }

    setCostRows(rows);
    setMargin(settings.default_profit_margin ?? 35);
  }, [
    loading,
    step,
    eventData.guestsCount,
    eventData.distanceKm,
    ingredients,
    fixedCosts,
    settings,
  ]);

  const totalCost = costRows.reduce((s, r) => s + r.totalPrice, 0);
  const suggestedSalePrice = margin <= 0 ? Math.ceil(totalCost) : Math.ceil(totalCost / (1 - margin / 100));
  const salePrice = salePriceOverride ?? suggestedSalePrice;
  const profit = salePrice - totalCost;
  const pricePerPerson = eventData.guestsCount > 0 ? salePrice / eventData.guestsCount : 0;
  const entryValue = payment.entryPercent ? (salePrice * payment.entryPercent) / 100 : payment.entryValue;
  const restValue = salePrice - entryValue;

  const canProceedStep1 =
    eventData.guestsCount >= 10 &&
    eventData.guestsCount <= 500 &&
    eventData.clientName.trim() !== "";

  async function saveDraft() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para continuar");
      setSaving(false);
      return;
    }
    let clientId = eventData.clientId;
    if (!clientId && eventData.clientName.trim()) {
      const { data: newClient } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: eventData.clientName.trim(),
        })
        .select("id")
        .single();
      if (newClient) clientId = newClient.id;
    }
    const eventPayload = {
      user_id: user.id,
      client_id: clientId || null,
      event_date: eventData.eventDate || null,
      event_time: eventData.eventTime || null,
      event_address: eventData.eventAddress || null,
      event_city: eventData.eventCity || null,
      distance_km: eventData.distanceKm,
      guests_count: eventData.guestsCount,
      status: "orcamento",
      ingredients_cost: costRows.filter((r) => !r.isFixed).reduce((s, r) => s + r.totalPrice, 0),
      transport_cost: costRows.find((r) => r.category === "transport")?.totalPrice ?? 0,
      fixed_cost: costRows.filter((r) => r.category === "fixed").reduce((s, r) => s + r.totalPrice, 0),
      total_cost: totalCost,
      profit_margin: margin,
      sale_price: salePrice,
      price_per_person: pricePerPerson,
      payment_entry: entryValue,
      payment_rest: restValue,
      payment_rest_date: payment.restDate || null,
      notes: [notes, `Pagamento: ${payment.paymentMethod}`].filter(Boolean).join(" | "),
    };
    let budgetNum: string | null = null;
    try {
      const res = await supabase.rpc("next_budget_number");
      budgetNum = res.data as string | null;
    } catch {
      // fallback se RPC não existir
    }
    if (!budgetNum) {
      const y = new Date().getFullYear();
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", `${y}-01-01`);
      budgetNum = `ORC-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }
    const payload = { ...eventPayload, budget_number: budgetNum };
    const { data: event, error: evErr } = await supabase.from("events").insert(payload).select("id").single();
    if (evErr) {
      toast.error(evErr.message);
      setSaving(false);
      return;
    }
    const items = costRows
      .filter((r) => r.ingredientId)
      .map((r) => ({
        event_id: event.id,
        ingredient_id: r.ingredientId,
        ingredient_name: r.name,
        quantity_kg: r.quantityKg,
        unit_price: r.unitPrice,
        total_price: r.totalPrice,
      }));
    if (items.length) {
      await supabase.from("event_items").insert(items);
    }
    toast.success("Orçamento salvo como rascunho");
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i + 1)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition
              ${step === i + 1 ? "bg-accent text-white" : "bg-surface text-foreground/80 hover:bg-border"}
            `}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <Step1EventData
          data={eventData}
          onChange={setEventData}
          onNext={() => setStep(2)}
          canProceed={canProceedStep1}
        />
      )}
      {step === 2 && (
        <Step2Costs
          costRows={costRows}
          setCostRows={setCostRows}
          margin={margin}
          setMargin={setMargin}
          totalCost={totalCost}
          salePrice={salePrice}
          salePriceOverride={salePriceOverride}
          setSalePriceOverride={setSalePriceOverride}
          suggestedSalePrice={suggestedSalePrice}
          profit={profit}
          pricePerPerson={pricePerPerson}
          guestsCount={eventData.guestsCount}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Payment
          payment={payment}
          setPayment={setPayment}
          salePrice={salePrice}
          entryValue={entryValue}
          restValue={restValue}
          eventDate={eventData.eventDate}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && (
        <Step4Review
          eventData={eventData}
          costRows={costRows}
          totalCost={totalCost}
          salePrice={salePrice}
          profit={profit}
          pricePerPerson={pricePerPerson}
          payment={payment}
          entryValue={entryValue}
          restValue={restValue}
          notes={notes}
          setNotes={setNotes}
          onBack={() => setStep(3)}
          onSaveDraft={saveDraft}
          saving={saving}
        />
      )}
    </div>
  );
}
