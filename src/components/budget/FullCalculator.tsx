"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";
import {
  initialFrutas,
  initialChocolate,
  initialDescartaveis,
  initialOutros,
  initialDespesas,
  initialOpcionais,
  type FruitItem,
  type ChocolateItem,
  type GenericItem,
  type OptionalItem,
} from "./initialItems";
import {
  getPropostaText,
  getContratoMessage,
} from "@/lib/whatsapp";
import { TextModal } from "./TextModal";
import { ContractPdfModal } from "./ContractPdfModal";
import { COMO_FUNCIONA_TEXT } from "@/lib/comoFuncionaText";

/** Snapshot completo da calculadora para salvar/carregar orçamento */
export type CalculatorSnapshot = {
  config: {
    guests: number;
    gramsPerPerson: number;
    chocolateGrams: number;
    distKm: number;
    margin: number;
    entryPercent: number;
    mesaTamanho: number;
    tempoEvento: number;
  };
  frutas: FruitItem[];
  chocolate: ChocolateItem[];
  descartaveis: GenericItem[];
  outros: GenericItem[];
  despesas: GenericItem[];
  opcionais: OptionalItem[];
};

export type EditInitialData = {
  eventId: string;
  event: {
    guests_count: number;
    distance_km: number;
    profit_margin: number;
    sale_price: number | null;
    budget_number: string | null;
    client_id: string | null;
    payment_entry: number | null;
    payment_rest: number | null;
  };
  eventItems: { ingredient_name: string | null; quantity_kg: number | null; unit_price: number | null }[];
  client: { name: string; phone: string | null } | null;
  calculator_snapshot?: CalculatorSnapshot | null;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

function SectionHeader({
  emoji,
  title,
  subtotal,
  color,
}: {
  emoji: string;
  title: string;
  subtotal: number;
  color: string;
}) {
  return (
    <div
      className="flex justify-between items-center py-2.5 px-4 rounded-t-lg border-l-4 mb-px"
      style={{ background: color + "15", borderLeftColor: color }}
    >
      <span className="font-bold text-sm text-foreground">{emoji} {title}</span>
      <span className="font-bold text-sm" style={{ color }}>{fmt(subtotal)}</span>
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  onQtyChange,
  onPriceChange,
}: {
  item: GenericItem;
  onToggle: () => void;
  onQtyChange: (v: number) => void;
  onPriceChange: (v: number) => void;
}) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.price) || 0;
  const lineTotal = qty * price;
  return (
    <div
      className="grid grid-cols-[24px_1fr_90px_16px_90px_90px] gap-2 items-center py-2 px-4 border-b border-border/50 text-sm"
      style={{ background: item.active ? "var(--surface)" : "#fafafa", opacity: item.active ? 1 : 0.45 }}
    >
      <input
        type="checkbox"
        checked={item.active}
        onChange={onToggle}
        className="w-4 h-4 rounded accent-accent cursor-pointer"
      />
      <span className="text-foreground">
        {item.name}
        {item.unit && <span className="text-foreground/50 text-xs ml-1">({item.unit})</span>}
      </span>
      <input
        type="number"
        min={0}
        step="any"
        value={qty}
        onChange={(e) => onQtyChange(Number(e.target.value) || 0)}
        disabled={!item.active}
        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm disabled:opacity-60"
      />
      <span className="text-foreground/30 text-center">×</span>
      <input
        type="number"
        min={0}
        step="any"
        value={price}
        onChange={(e) => onPriceChange(Number(e.target.value) || 0)}
        disabled={!item.active}
        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm disabled:opacity-60"
      />
      <span className={`text-right font-semibold ${item.active ? "text-foreground" : "text-foreground/30"}`}>
        {fmt(item.active ? lineTotal : 0)}
      </span>
    </div>
  );
}

function ItemRowPerPerson({
  item,
  guests,
  onToggle,
  onQtdPorPessoaChange,
  onPriceChange,
}: {
  item: GenericItem;
  guests: number;
  onToggle: () => void;
  onQtdPorPessoaChange: (v: number) => void;
  onPriceChange: (v: number) => void;
}) {
  const qtdPorPessoa = Number(item.qtdPorPessoa) || 1;
  const totalUnits = guests * qtdPorPessoa;
  const price = Number(item.price) || 0;
  const lineTotal = totalUnits * price;
  return (
    <div
      className="grid grid-cols-[24px_1fr_140px_24px_90px_90px] gap-2 items-center py-2 px-4 border-b border-border/50 text-sm"
      style={{ background: item.active ? "var(--surface)" : "#fafafa", opacity: item.active ? 1 : 0.45 }}
    >
      <input
        type="checkbox"
        checked={item.active}
        onChange={onToggle}
        className="w-4 h-4 rounded accent-accent cursor-pointer"
      />
      <span className="text-foreground">{item.name}</span>
      <div className="flex items-center justify-center gap-1 whitespace-nowrap flex-nowrap min-w-0 pr-1">
        <label className="text-[10px] text-foreground/60 shrink-0">Qtd/pessoa:</label>
        <input
          type="number"
          min={0}
          step="any"
          value={qtdPorPessoa}
          onChange={(e) => onQtdPorPessoaChange(Number(e.target.value) || 0)}
          disabled={!item.active}
          className="w-12 shrink-0 px-1 py-0.5 rounded border border-border bg-background text-foreground text-center text-xs disabled:opacity-60"
        />
        <span className="text-foreground/80 text-xs tabular-nums shrink-0 whitespace-nowrap">→ {totalUnits}{" "}un</span>
      </div>
      <span className="text-foreground/30 text-center shrink-0 w-6">×</span>
      <input
        type="number"
        min={0}
        step="any"
        value={price}
        onChange={(e) => onPriceChange(Number(e.target.value) || 0)}
        disabled={!item.active}
        className="w-full ml-1 px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm disabled:opacity-60"
      />
      <span className={`text-right font-semibold ${item.active ? "text-foreground" : "text-foreground/30"}`}>
        {fmt(item.active ? lineTotal : 0)}
      </span>
    </div>
  );
}

const FRUIT_NAMES = initialFrutas.map((f) => f.name);
const CHOCOLATE_NAME_SUBSTR = "Chocolate";

export default function FullCalculator({ initialData }: { initialData?: EditInitialData | null }) {
  const router = useRouter();
  const editMode = !!initialData;
  const [guests, setGuests] = useState(initialData?.event.guests_count ?? 100);
  const [gramsPerPerson, setGramsPerPerson] = useState(200);
  const [chocolateGrams, setChocolateGrams] = useState(60);
  const [margin, setMargin] = useState(initialData?.event.profit_margin ?? 35);
  const [distKm, setDistKm] = useState(initialData?.event.distance_km ?? 30);
  const [mesaTamanho, setMesaTamanho] = useState(2.5);
  const [tempoEvento, setTempoEvento] = useState(4);
  const [observacoes, setObservacoes] = useState(
    "• Taças de vidros de diversos modelos.\n• Cubos de espelhos para ornamentação e embelezamento da mesa"
  );
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState(initialData?.client?.name ?? "");
  const [clientPhone, setClientPhone] = useState(initialData?.client?.phone ?? "");
  const [entryPercent, setEntryPercent] = useState(30);
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false);
  const [modalContratoOpen, setModalContratoOpen] = useState(false);
  const [modalComoFuncionaOpen, setModalComoFuncionaOpen] = useState(false);
  const [showResumoModal, setShowResumoModal] = useState(false);

  const [budgetNumber, setBudgetNumber] = useState(initialData?.event.budget_number ?? "");
  const [proposalDate, setProposalDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  });

  useEffect(() => {
    if (!initialData) return;
    const snap = initialData.calculator_snapshot;
    if (snap?.config) {
      setGuests(snap.config.guests ?? 100);
      setGramsPerPerson(snap.config.gramsPerPerson ?? 200);
      setChocolateGrams(snap.config.chocolateGrams ?? 60);
      setDistKm(snap.config.distKm ?? 30);
      setMargin(snap.config.margin ?? 35);
      setEntryPercent(snap.config.entryPercent ?? 30);
      setMesaTamanho(Number(snap.config.mesaTamanho) || 2.5);
      setTempoEvento(Math.max(1, Number(snap.config.tempoEvento) || 4));
    } else {
      setGuests(initialData.event.guests_count ?? 100);
      setDistKm(initialData.event.distance_km ?? 30);
      setMargin(initialData.event.profit_margin ?? 35);
      const sale = initialData.event.sale_price ?? 0;
      const entry = initialData.event.payment_entry ?? 0;
      setEntryPercent(sale > 0 ? Math.round((entry / sale) * 100) : 30);
    }
    if (typeof (snap as { observacoes?: string })?.observacoes === "string") {
      setObservacoes((snap as { observacoes: string }).observacoes);
    }
    if (snap?.frutas?.length) {
      setFrutas(snap.frutas.map((f) => ({ ...f })));
    } else {
      const items = initialData.eventItems;
      const guestsCount = initialData.event.guests_count || 100;
      const fruitItems = items.filter((i) => i.ingredient_name && FRUIT_NAMES.includes(i.ingredient_name));
      const totalFruitKg = fruitItems.reduce((s, i) => s + (Number(i.quantity_kg) || 0), 0);
      const grams = totalFruitKg > 0 ? Math.round((totalFruitKg * 1000) / guestsCount) : 200;
      setGramsPerPerson(grams);
      const nextFrutas = initialFrutas.map((f) => {
        const found = fruitItems.find((i) => i.ingredient_name === f.name);
        if (!found || totalFruitKg <= 0) return { ...f, active: true };
        const kg = Number(found.quantity_kg) || 0;
        return {
          ...f,
          pct: Math.round((kg / totalFruitKg) * 100),
          pricePerKg: Number(found.unit_price) || f.pricePerKg,
          active: true,
        };
      });
      setFrutas(nextFrutas);
    }
    if (snap?.chocolate?.length) {
      setChocolate(snap.chocolate.map((c) => ({ ...c })));
    } else {
      const items = initialData.eventItems;
      const guestsCount = initialData.event.guests_count || 100;
      const chocItem = items.find((i) => i.ingredient_name?.includes(CHOCOLATE_NAME_SUBSTR));
      if (chocItem && chocItem.quantity_kg != null) {
        setChocolateGrams(Math.round((Number(chocItem.quantity_kg) * 1000) / guestsCount));
      }
      if (chocItem && initialChocolate[0]) {
        setChocolate([
          {
            ...initialChocolate[0],
            pricePerKg: Number(chocItem.unit_price) || initialChocolate[0].pricePerKg,
            gramsPerPerson: chocItem.quantity_kg != null ? Math.round((Number(chocItem.quantity_kg) * 1000) / guestsCount) : 60,
            active: true,
          },
        ]);
      }
    }
    if (snap?.descartaveis?.length) setDescartaveis(snap.descartaveis.map((d) => ({ ...d })));
    if (snap?.outros?.length) setOutros(snap.outros.map((o) => ({ ...o })));
    if (snap?.despesas?.length) setDespesas(snap.despesas.map((d) => ({ ...d })));
    if (snap?.opcionais?.length) {
      setOpcionais(
        snap.opcionais.map((o) => {
          const base = initialOpcionais.find((def) => def.id === o.id) ?? { id: o.id, name: o.name, qty: 1, price: 0, unit: "", active: false };
          return { ...base, ...o, id: o.id, name: o.name, active: !!o.active };
        })
      );
    }
  }, [initialData?.eventId]);

  useEffect(() => {
    if (editMode) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const res = await supabase.rpc("next_budget_number");
        const raw = res.data;
        const num = Array.isArray(raw) ? raw[0] : raw;
        if (!cancelled) setBudgetNumber(num != null && String(num).trim() ? String(num) : `ORC-${new Date().getFullYear()}-001`);
      } catch {
        if (!cancelled) setBudgetNumber(`ORC-${new Date().getFullYear()}-001`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editMode]);

  const [frutas, setFrutas] = useState<FruitItem[]>(initialFrutas.map((f) => ({ ...f })));
  const [chocolate, setChocolate] = useState<ChocolateItem[]>(initialChocolate.map((c) => ({ ...c })));
  const [descartaveis, setDescartaveis] = useState<GenericItem[]>(initialDescartaveis.map((d) => ({ ...d })));
  const [outros, setOutros] = useState<GenericItem[]>(initialOutros.map((o) => ({ ...o })));
  const [despesas, setDespesas] = useState<GenericItem[]>(initialDespesas.map((d) => ({ ...d })));
  const [opcionais, setOpcionais] = useState<OptionalItem[]>(initialOpcionais.map((o) => ({ ...o })));

  const updateItem = <T extends { id: string }>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    field: keyof T,
    value: unknown
  ) => {
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  // ——— Cálculos em tempo real (recalculam a cada alteração de estado) ———
  // Frutas: total_kg = (g/pessoa × convidados)/1000; por item: (pct/100)×total_kg×preço_kg
  const totalFruitKg = (gramsPerPerson * guests) / 1000;
  const fruitPctTotal = frutas.reduce((s, f) => s + f.pct, 0);
  const fruitMixStatus = fruitPctTotal === 100 ? "ok" : fruitPctTotal < 100 ? "under" : "over";
  const fruitCost = frutas.reduce((sum, f) => {
    if (!f.active) return sum;
    return sum + (f.pct / 100) * totalFruitKg * f.pricePerKg;
  }, 0);

  // Chocolate: quantidade_final = max(calculado, mínimo_kg); custo = qtd_final × preço_kg
  const chocKgCalculated = (chocolateGrams * guests) / 1000;
  const chocMinFixedKg = chocolate[0]?.minFixedKg ?? 4;
  const chocKgFinal = Math.max(chocKgCalculated, chocMinFixedKg);
  const chocUsesMinimum = chocKgCalculated < chocMinFixedKg;
  const chocCost = chocolate[0]?.active ? chocKgFinal * chocolate[0].pricePerKg : 0;

  // Descartáveis: total = qtd × preço (qtd = convidados×qtdPorPessoa quando tem qtdPorPessoa)
  const descCost = descartaveis.reduce((s, i) => {
    if (!i.active) return s;
    const qty = i.qtdPorPessoa != null ? guests * i.qtdPorPessoa : i.qty;
    return s + qty * i.price;
  }, 0);

  // Outros / Opcionais / Despesas: total = qtd × preço (fixos: custo = qty como valor)
  const outrosCost = outros.reduce((s, i) => (i.active ? s + i.qty * i.price : s), 0);
  const despesasCost = despesas.reduce((s, i) => {
    if (!i.active) return s;
    if (i.id === "combustivel_evento") return s + distKm * (i.price ?? 2.5);
    if (i.id === "combustivel" || i.id === "internet") return s + i.qty;
    return s + i.qty * i.price;
  }, 0);
  const opcionaisCost = opcionais.reduce((s, i) => (i.active ? s + i.qty * i.price : s), 0);

  // Total geral = soma dos subtotais de cada seção (sem opcionais); com opcionais = total + opcionais
  const totalCost = fruitCost + chocCost + descCost + outrosCost + despesasCost;
  const totalWithOpcionais = totalCost + opcionaisCost;

  // Preço de venda = total geral / (1 - margem/100), arredondado para cima ao inteiro; lucro e por pessoa em cima do valor arredondado
  const marginRatio = Math.min(99.99, Math.max(0, margin)) / 100;
  const salePrice = Math.ceil(totalWithOpcionais / (1 - marginRatio));
  const profit = salePrice - totalWithOpcionais;
  const pricePerPerson = guests > 0 ? salePrice / guests : 0;
  const realMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;

  // Entrada = preço de venda × (% entrada / 100); Restante = preço de venda - entrada
  const entrada = salePrice * (entryPercent / 100);
  const restante = salePrice - entrada;

  function buildCalculatorSnapshot(): CalculatorSnapshot & { entradaPercent?: number; mesaTamanho?: number; tempoEvento?: number; observacoes?: string } {
    return {
      config: {
        guests,
        gramsPerPerson,
        chocolateGrams,
        distKm,
        margin,
        entryPercent,
        mesaTamanho,
        tempoEvento,
      },
      entradaPercent: entryPercent,
      mesaTamanho,
      tempoEvento,
      observacoes: observacoes.trim() || undefined,
      frutas: frutas.map((f) => ({ ...f })),
      chocolate: chocolate.map((c) => ({ ...c })),
      descartaveis: descartaveis.map((d) => ({ ...d })),
      outros: outros.map((o) => ({ ...o })),
      despesas: despesas.map((d) => ({ ...d })),
      // Opcionais (Mini Cascata, Hora Adicional): id, name e active são usados no contrato PDF (cláusula 4.2)
      opcionais: opcionais.map((o) => ({ id: o.id, name: o.name, active: o.active, qty: o.qty, price: o.price, unit: o.unit, ...(o.desc != null && { desc: o.desc }) })),
    };
  }

  async function handleSave(andConfirm: boolean) {
    setSaving(true);
    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Supabase não configurado.");
      setSaving(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para continuar");
      setSaving(false);
      return;
    }
    const safe = (v: number) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    const paymentEntry = safe(salePrice) * (entryPercent / 100);
    const paymentRest = safe(salePrice) * ((100 - entryPercent) / 100);

    if (editMode && initialData) {
      let clientId: string | null = initialData.event.client_id;
      if (clientName.trim()) {
        const existingId = initialData.event.client_id;
        if (existingId) {
          await supabase.from("clients").update({ name: clientName.trim(), phone: clientPhone.trim() || null }).eq("id", existingId);
          clientId = existingId;
        } else {
          const { data: newClient, error: clientErr } = await supabase
            .from("clients")
            .insert({ user_id: user.id, name: clientName.trim(), phone: clientPhone.trim() || null })
            .select("id")
            .single();
          if (!clientErr && newClient) clientId = newClient.id;
        }
      }
      const updatePayload = {
        client_id: clientId,
        distance_km: safe(distKm),
        guests_count: Math.max(1, Math.floor(safe(guests))),
        total_cost: safe(totalWithOpcionais),
        profit_margin: safe(margin),
        sale_price: safe(salePrice),
        price_per_person: safe(pricePerPerson),
        payment_entry: paymentEntry,
        payment_rest: paymentRest,
        updated_at: new Date().toISOString(),
        calculator_snapshot: buildCalculatorSnapshot(),
      };
      const { error: updateErr } = await supabase.from("events").update(updatePayload).eq("id", initialData.eventId);
      if (updateErr) {
        toast.error(`Erro ao atualizar: ${updateErr.message}`);
        setSaving(false);
        return;
      }
      await supabase.from("event_items").delete().eq("event_id", initialData.eventId);
      const items: { event_id: string; ingredient_id: string | null; ingredient_name: string; quantity_kg: number; unit_price: number; total_price: number }[] = [];
      frutas.filter((f) => f.active).forEach((f) => {
        const kg = (f.pct / 100) * totalFruitKg;
        items.push({ event_id: initialData.eventId, ingredient_id: null, ingredient_name: f.name, quantity_kg: kg, unit_price: f.pricePerKg, total_price: kg * f.pricePerKg });
      });
      items.push({
        event_id: initialData.eventId,
        ingredient_id: null,
        ingredient_name: chocolate[0]?.name || "Chocolate",
        quantity_kg: chocKgFinal,
        unit_price: chocolate[0]?.pricePerKg || 100,
        total_price: chocCost,
      });
      if (items.length) {
        await supabase.from("event_items").insert(items);
      }
      if (andConfirm) {
        let contractNum: string | null = null;
        try {
          const res = await supabase.rpc("next_contract_number");
          const raw = res.data;
          contractNum = Array.isArray(raw) ? (raw[0] ?? null) : (raw as string | null);
        } catch {
          const y = new Date().getFullYear();
          const { data: evs } = await supabase.from("events").select("id").eq("user_id", user.id).gte("created_at", `${y}-01-01`);
          const ids = (evs ?? []).map((e: { id: string }) => e.id);
          const { count } = ids.length ? await supabase.from("contracts").select("id", { count: "exact", head: true }).in("event_id", ids) : { count: 0 };
          contractNum = `CTR-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
        }
        await supabase.from("events").update({ status: "contrato_gerado", contract_number: contractNum }).eq("id", initialData.eventId);
        await supabase.from("contracts").insert({ event_id: initialData.eventId });
        toast.success("Orçamento atualizado!");
      } else {
        toast.success("Orçamento atualizado!");
      }
      router.push("/budget");
      router.refresh();
      setSaving(false);
      return;
    }

    let clientId: string | null = null;
    if (clientName.trim()) {
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({ user_id: user.id, name: clientName.trim(), phone: clientPhone.trim() || null })
        .select("id")
        .single();
      if (!clientErr && newClient) clientId = newClient.id;
    }
    let budgetNum: string | null = null;
    try {
      const res = await supabase.rpc("next_budget_number");
      const raw = res.data;
      budgetNum = Array.isArray(raw) ? (raw[0] ?? null) : (raw as string | null);
    } catch {
      const y = new Date().getFullYear();
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", `${y}-01-01`);
      budgetNum = `ORC-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
    }
    if (!budgetNum) budgetNum = `ORC-${new Date().getFullYear()}-001`;

    const payload = {
      user_id: user.id,
      client_id: clientId,
      distance_km: safe(distKm),
      guests_count: Math.max(1, Math.floor(safe(guests))),
      status: "orcamento",
      total_cost: safe(totalWithOpcionais),
      profit_margin: safe(margin),
      sale_price: safe(salePrice),
      price_per_person: safe(pricePerPerson),
      payment_entry: paymentEntry,
      payment_rest: paymentRest,
      budget_number: budgetNum,
      calculator_snapshot: buildCalculatorSnapshot(),
    };
    const { data: event, error } = await supabase.from("events").insert(payload).select("id").single();
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      setSaving(false);
      return;
    }
    const items: { event_id: string; ingredient_id: string | null; ingredient_name: string; quantity_kg: number; unit_price: number; total_price: number }[] = [];
    frutas.filter((f) => f.active).forEach((f) => {
      const kg = (f.pct / 100) * totalFruitKg;
      items.push({ event_id: event.id, ingredient_id: null, ingredient_name: f.name, quantity_kg: kg, unit_price: f.pricePerKg, total_price: kg * f.pricePerKg });
    });
    items.push({
      event_id: event.id,
      ingredient_id: null,
      ingredient_name: chocolate[0]?.name || "Chocolate",
      quantity_kg: chocKgFinal,
      unit_price: chocolate[0]?.pricePerKg || 100,
      total_price: chocCost,
    });
    if (items.length) {
      const { error: itemsErr } = await supabase.from("event_items").insert(items);
      if (itemsErr) {
        toast.error(`Orçamento salvo, mas itens não: ${itemsErr.message}`);
      }
    }
    if (andConfirm) {
      let contractNum: string | null = null;
      try {
        const res = await supabase.rpc("next_contract_number");
        const raw = res.data;
        contractNum = Array.isArray(raw) ? (raw[0] ?? null) : (raw as string | null);
      } catch {
        const y = new Date().getFullYear();
        const { data: evs } = await supabase.from("events").select("id").eq("user_id", user.id).gte("created_at", `${y}-01-01`);
        const ids = (evs ?? []).map((e: { id: string }) => e.id);
        const { count } = ids.length ? await supabase.from("contracts").select("id", { count: "exact", head: true }).in("event_id", ids) : { count: 0 };
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

  const valorEntradaProposta = salePrice * 0.3;
  const numeroOrcamento = budgetNumber || `ORC-${new Date().getFullYear()}-001`;
  const propostaText = getPropostaText({
    convidados: guests,
    valorTotal: salePrice,
    valorEntrada: valorEntradaProposta,
    numeroOrcamento,
    dataOrcamento: proposalDate,
    nomeCliente: clientName || undefined,
  });
  const contratoMessage = getContratoMessage({
    nomeCliente: clientName || "Cliente",
    dataEvento: "A definir",
    convidados: guests,
    valorTotal: salePrice,
  });

  function getResumoContratoText() {
    const nomeCliente = clientName ?? "";
    const cpfCnpj = "";
    const endereco = "";
    const telefone = clientPhone ?? "";
    const localEvento = "";
    const convidados = guests;
    const horarioEvento = "";
    const dataEvento = "";
    const valorTotal = salePrice;
    const valorEntrada = entrada;
    const valorRestante = restante;
    const entradaPercent = entryPercent;
    const calculatorSnapshot = buildCalculatorSnapshot();

    const fmt = (v: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

    const entradaValor = valorEntrada || (valorTotal * (entradaPercent || 30)) / 100;
    const restanteValor = valorRestante || valorTotal - entradaValor;

    const calcHorarioFim = () => {
      try {
        const h = horarioEvento || "";
        if (!h || !h.includes(":")) return "—";
        const [hh, mm] = h.split(":").map(Number);
        if (isNaN(hh) || isNaN(mm)) return "—";
        const d = new Date(2000, 0, 1, hh, mm);
        const tempo = calculatorSnapshot?.tempoEvento ?? calculatorSnapshot?.config?.tempoEvento ?? 4;
        d.setHours(d.getHours() + Number(tempo));
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch { return "—"; }
    };

    const calcDataLimite = () => {
      try {
        const s = (dataEvento || "").trim();
        if (!s) return "—";
        const d = s.includes("T") ? new Date(s) : new Date(`${s}T12:00:00`);
        d.setDate(d.getDate() - 5);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      } catch { return "—"; }
    };

    const tempo = calculatorSnapshot?.tempoEvento ?? calculatorSnapshot?.config?.tempoEvento ?? 4;
    const mesa = calculatorSnapshot?.mesaTamanho ?? calculatorSnapshot?.config?.mesaTamanho ?? 2.5;

    const obs = (calculatorSnapshot?.observacoes ?? "").trim();
    const obsLinhas = obs
      ? obs
        .split(/\r?\n/)
        .filter((l: string) => l.trim())
        .map((l: string) => `\u2022 ${l.replace(/^[\u2022\-]\s*/, "").trim()}`)
        .join("\n")
      : "";

    const horarioInicio = horarioEvento || "—";
    const horarioFim = calcHorarioFim();

    const linhas = [
      "📋 RESUMO DO CONTRATO – CHOCONICK FONDUE",
      "",
      "👤 CONTRATANTE",
      `Nome: ${nomeCliente || "—"}`,
      `CPF/CNPJ: ${cpfCnpj || "—"}`,
      `Telefone: ${telefone || "—"}`,
      `Endereço: ${endereco || "—"}`,
      "",
      "⚠️ PONTOS IMPORTANTES",
      "",
      `📍 Local do evento: ${localEvento || "—"}`,
      `👥 Número de convidados: ${convidados || "—"}`,
      `⏱️ Duração: ${tempo}h — das ${horarioInicio} às ${horarioFim}`,
      "",
      `💰 Valor total: ${fmt(valorTotal)}`,
      `💳 Entrada (${Math.round(entradaPercent || 30)}%): ${fmt(entradaValor)}`,
      `📆 Restante: ${fmt(restanteValor)} — pagar até ${calcDataLimite()} (5 dias antes do evento)`,
      "",
      "🏦 Pagamento via PIX: (62) 98254-8965 – PagSeguro",
      "Ou transferência: CEF – Ag 3037 / CC 28655-0 / OP 013",
      "Em nome de Tatiana A. Stradioto.",
      "",
      "🪑 OBRIGAÇÕES DO CONTRATANTE:",
      `• Fornecer mesa firme com no mínimo ${Number(mesa).toLocaleString("pt-BR")}m de comprimento`,
      "• Mesa não pode estar em local com corrente de ar ou ventania",
      "• Disponibilizar ponto de energia próximo à mesa",
      "• Liberar acesso ao local 3h antes do evento para montagem",
    ];

    if (obsLinhas) {
      linhas.push("");
      linhas.push("📝 OBSERVAÇÕES:");
      linhas.push(obsLinhas);
    }

    linhas.push("");
    linhas.push("⚠️ O fondue é calculado para eventos com estrutura equilibrada:");
    linhas.push("Entrada → Almoço/Jantar → Bebidas → Bolo");
    linhas.push("Sem essa estrutura, o tempo de serviço pode reduzir para menos de 4 horas.");
    linhas.push("Não trabalhamos com reposição de produtos.");

    return linhas.join("\n");
  }

  const handleAgendarData = async () => {
    const nomeCliente = clientName ?? "";
    const cpfCnpj = "";
    const endereco = "";
    const telefone = clientPhone ?? "";
    const email = "";
    const dataEvento = "";
    const horarioEvento = "";
    const localEvento = "";
    const convidados = guests;
    const valorTotal = salePrice;
    const valorEntrada = entrada;
    const valorRestante = restante;
    const selectedClientId = editMode ? initialData?.event?.client_id ?? null : null;
    const eventIdToUse = editMode ? initialData?.eventId ?? null : null;
    const entradaPercent = entryPercent;
    const calculatorSnapshot = buildCalculatorSnapshot();

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar.");
        return;
      }

      let clientId: string | null = selectedClientId ?? null;
      if (!clientId && nomeCliente.trim()) {
        const { data: existing } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", nomeCliente.trim())
          .maybeSingle();
        if (existing?.id) {
          clientId = existing.id;
        } else {
          const { data: inserted } = await supabase
            .from("clients")
            .insert({
              user_id: user.id,
              name: nomeCliente.trim(),
              phone: telefone.trim() || null,
              email: email.trim() || null,
              cpf: cpfCnpj.trim() || null,
              address: endereco.trim() || null,
            })
            .select("id")
            .single();
          clientId = inserted?.id ?? null;
        }
      }

      if (eventIdToUse) {
        await supabase.from("events").update({
          event_date: dataEvento || null,
          event_time: horarioEvento || null,
          event_address: localEvento.trim() || null,
          guests_count: convidados || null,
          sale_price: valorTotal || null,
          payment_entry: valorEntrada || null,
          payment_rest: valorRestante || null,
          entry_percent: entradaPercent || null,
          calculator_snapshot: calculatorSnapshot || null,
          client_id: clientId,
          status: "contrato_gerado",
          updated_at: new Date().toISOString(),
        }).eq("id", eventIdToUse);
      } else {
        await supabase.from("events").insert({
          user_id: user.id,
          client_id: clientId,
          event_date: dataEvento || null,
          event_time: horarioEvento || null,
          event_address: localEvento.trim() || null,
          guests_count: Math.max(1, convidados || 0),
          sale_price: valorTotal || null,
          payment_entry: valorEntrada || null,
          payment_rest: valorRestante || null,
          entry_percent: entradaPercent || null,
          calculator_snapshot: calculatorSnapshot || null,
          status: "contrato_gerado",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      toast.success("Evento agendado na agenda com sucesso!");
      setShowResumoModal(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao agendar evento.");
    }
  };

  return (
    <div className="font-sans bg-background min-h-screen p-5">
      <div className="max-w-[980px] mx-auto">
        {editMode && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Editando orçamento {budgetNumber || initialData?.event.budget_number || "—"}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/budget"
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-foreground text-sm font-medium hover:bg-muted/50"
              >
                ← Voltar
              </Link>
              <Link
                href="/budget/new"
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
              >
                + Novo Orçamento
              </Link>
            </div>
          </div>
        )}
        {!editMode && (
          <div className="mb-4">
            <Link
              href="/budget"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground"
            >
              ← Voltar
            </Link>
          </div>
        )}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
          <div>
            <div className="text-[10px] tracking-widest text-accent uppercase">ChocoNick · Orçamento</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-xl font-extrabold text-foreground">Calculadora Completa</span>
              <span className="text-foreground/60">·</span>
              <span className="text-sm font-medium text-foreground">
                Orçamento #{budgetNumber || `ORC-${new Date().getFullYear()}-001`}
              </span>
              <span className="text-foreground/60">·</span>
              <span className="text-sm text-foreground/80">📅</span>
              <input
                type="text"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-28 px-2 py-1 rounded border border-border bg-surface text-foreground text-sm"
                title="Data do orçamento (editável)"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Cliente"
              className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm w-40"
            />
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Telefone WhatsApp"
              className="px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm w-40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          <div className="flex flex-col gap-3">
            <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
              <div className="text-[11px] font-bold tracking-wider text-foreground/60 uppercase mb-3">Configurações do Evento</div>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-foreground/50 block mb-1">Convidados</label>
                    <input
                      type="number"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-accent bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground/50 block mb-1">Frutas (g/pessoa)</label>
                    <input
                      type="number"
                      value={gramsPerPerson}
                      onChange={(e) => setGramsPerPerson(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground/50 block mb-1">Chocolate (g/pessoa)</label>
                    <input
                      type="number"
                      value={chocolateGrams}
                      onChange={(e) => setChocolateGrams(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-foreground/50 block mb-1">Distância (km)</label>
                    <input
                      type="number"
                      value={distKm}
                      onChange={(e) => setDistKm(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="text-[10px] text-foreground/50 block mb-1">Tamanho da mesa (m)</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={mesaTamanho}
                      onChange={(e) => setMesaTamanho(Math.max(0.1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] text-foreground/50 block mb-1">Tempo de evento (h)</label>
                    <input
                      type="number"
                      step={1}
                      min={1}
                      value={tempoEvento}
                      onChange={(e) => setTempoEvento(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-base font-extrabold text-center outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[24px_1fr_90px_16px_90px_90px] gap-2 px-4 text-[10px] text-foreground/50 uppercase tracking-wider">
              {["", "Item", "Qtd", "", "Preço un.", "Total"].map((h, i) => (
                <span key={i} className={i > 2 ? "text-center" : ""}>{h}</span>
              ))}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border border-border">
              <SectionHeader emoji="🍓" title={`Frutas — ${totalFruitKg.toFixed(1)}kg total (${gramsPerPerson}g/pessoa)`} subtotal={fruitCost} color="#e11d48" />
              <div className="grid grid-cols-[24px_1fr_56px_20px_90px_16px_90px_90px] gap-2 items-center px-4 py-1.5 text-[10px] text-foreground/50 uppercase tracking-wider border-b border-border/50">
                <span />
                <span>Item</span>
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-foreground/50">%</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                      fruitMixStatus === "ok"
                        ? "bg-green-500/20 text-green-800 dark:text-green-200"
                        : fruitMixStatus === "under"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                          : "bg-red-500/20 text-red-800 dark:text-red-200"
                    }`}
                  >
                    {fruitMixStatus === "ok" && <>✓ {fruitPctTotal.toFixed(0)}%</>}
                    {fruitMixStatus === "under" && <>⚠️ {fruitPctTotal.toFixed(0)}% (faltam {(100 - fruitPctTotal).toFixed(0)}%)</>}
                    {fruitMixStatus === "over" && <>✗ {fruitPctTotal.toFixed(0)}% (excedeu {(fruitPctTotal - 100).toFixed(0)}%)</>}
                  </span>
                </span>
                <span />
                <span className="text-center">Qtd</span>
                <span />
                <span className="text-center">Preço un.</span>
                <span className="text-right">Total</span>
              </div>
              {frutas.map((f) => {
                const kg = (f.pct / 100) * totalFruitKg;
                return (
                  <div
                    key={f.id}
                    className="grid grid-cols-[24px_1fr_56px_20px_90px_16px_90px_90px] gap-2 items-center py-2 px-4 border-b border-border/50 text-sm"
                    style={{ opacity: f.active ? 1 : 0.4 }}
                  >
                    <input type="checkbox" checked={f.active} onChange={() => updateItem(setFrutas, f.id, "active", !f.active)} className="w-4 h-4 rounded accent-accent cursor-pointer" />
                    <span className="text-foreground min-w-0 truncate">{f.name}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={f.pct}
                      onChange={(e) => updateItem(setFrutas, f.id, "pct", Number(e.target.value) || 0)}
                      className="w-full min-w-0 max-w-[56px] px-1 py-0.5 rounded border border-border bg-background text-foreground text-xs text-center outline-none box-border justify-self-center"
                    />
                    <span className="text-foreground/50 text-xs">%</span>
                    <span className="text-center text-foreground/70">{kg.toFixed(2)}kg</span>
                    <span className="text-foreground/30 text-center">×</span>
                    <input type="number" min={0} step="any" value={f.pricePerKg} onChange={(e) => updateItem(setFrutas, f.id, "pricePerKg", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                    <span className="text-right font-semibold text-foreground">{fmt(f.active ? kg * (Number(f.pricePerKg) || 0) : 0)}</span>
                  </div>
                );
              })}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border border-border">
              <SectionHeader emoji="🍫" title={`Chocolate — ${chocKgFinal.toFixed(2)}kg (${chocolateGrams}g/pessoa)`} subtotal={chocCost} color="#92400e" />
              {chocolate.map((c) => (
                <div key={c.id} className="space-y-2">
                  <div className="grid grid-cols-[24px_1fr_90px_16px_90px_90px] gap-2 items-center py-2 px-4 border-b border-border/50 text-sm">
                    <input type="checkbox" checked={c.active} onChange={() => updateItem(setChocolate, c.id, "active", !c.active)} className="w-4 h-4 rounded accent-accent cursor-pointer" />
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground">{c.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="text-[10px] text-foreground/60 flex items-center gap-1">
                          Mínimo fixo (kg):
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={c.minFixedKg ?? 4}
                            onChange={(e) => updateItem(setChocolate, c.id, "minFixedKg", Number(e.target.value) || 0)}
                            className="w-14 px-1.5 py-0.5 rounded border border-border bg-background text-foreground text-xs text-center outline-none"
                          />
                        </label>
                        <span
                          className={`text-xs font-medium ${chocUsesMinimum ? "text-accent bg-accent/15 px-2 py-0.5 rounded" : "text-foreground/70"}`}
                        >
                          {chocKgFinal.toFixed(1)}kg utilizados ({chocUsesMinimum ? "mínimo fixo" : "calculado"})
                        </span>
                      </div>
                    </div>
                    <span className="text-center text-foreground/70">{chocKgFinal.toFixed(2)}kg</span>
                    <span className="text-foreground/30 text-center">×</span>
                    <input type="number" min={0} step="any" value={c.pricePerKg} onChange={(e) => updateItem(setChocolate, c.id, "pricePerKg", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                    <span className="text-right font-semibold text-foreground">{fmt(c.active ? chocKgFinal * (Number(c.pricePerKg) || 0) : 0)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border border-border">
              <SectionHeader emoji="🥄" title="Descartáveis" subtotal={descCost} color="#0891b2" />
              {descartaveis.map((i) =>
                i.qtdPorPessoa != null ? (
                  <ItemRowPerPerson
                    key={i.id}
                    item={i}
                    guests={guests}
                    onToggle={() => updateItem(setDescartaveis, i.id, "active", !i.active)}
                    onQtdPorPessoaChange={(v) => updateItem(setDescartaveis, i.id, "qtdPorPessoa", v)}
                    onPriceChange={(v) => updateItem(setDescartaveis, i.id, "price", v)}
                  />
                ) : (
                  <ItemRow key={i.id} item={i} onToggle={() => updateItem(setDescartaveis, i.id, "active", !i.active)} onQtyChange={(v) => updateItem(setDescartaveis, i.id, "qty", v)} onPriceChange={(v) => updateItem(setDescartaveis, i.id, "price", v)} />
                )
              )}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border border-border">
              <SectionHeader emoji="🛒" title="Outros Itens" subtotal={outrosCost} color="#7c3aed" />
              {outros.map((i) => (
                <ItemRow key={i.id} item={i} onToggle={() => updateItem(setOutros, i.id, "active", !i.active)} onQtyChange={(v) => updateItem(setOutros, i.id, "qty", v)} onPriceChange={(v) => updateItem(setOutros, i.id, "price", v)} />
              ))}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border-2 border-dashed border-accent">
              <div className="flex justify-between items-center py-2.5 px-4 bg-accent/10 border-l-4 border-accent rounded-t-lg">
                <div>
                  <span className="font-bold text-sm text-foreground">⭐ Opcionais do Cliente</span>
                  <span className="text-xs text-accent bg-accent/20 ml-2 px-2 py-0.5 rounded-full">Cliente escolhe se quer</span>
                </div>
                <span className="font-bold text-sm text-accent">{fmt(opcionaisCost)}</span>
              </div>
              {opcionais.map((i) => (
                <div key={i.id} className="grid grid-cols-[24px_1fr_90px_16px_90px_90px] gap-2 items-center py-2.5 px-4 border-b border-border/50 text-sm" style={{ background: i.active ? "rgb(255 247 237)" : "var(--surface)", opacity: i.active ? 1 : 0.5 }}>
                  <input type="checkbox" checked={i.active} onChange={() => updateItem(setOpcionais, i.id, "active", !i.active)} className="w-4 h-4 rounded accent-accent cursor-pointer" />
                  <div>
                    <div className="font-semibold text-foreground">{i.name}</div>
                    {i.desc && <div className="text-xs text-foreground/50">{i.desc}</div>}
                  </div>
                  <input type="number" min={0} step="any" value={Number(i.qty) || 0} onChange={(e) => updateItem(setOpcionais, i.id, "qty", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                  <span className="text-foreground/30 text-center">×</span>
                  <input type="number" min={0} step="any" value={Number(i.price) || 0} onChange={(e) => updateItem(setOpcionais, i.id, "price", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                  <span className={`text-right font-semibold ${i.active ? "text-accent" : "text-foreground/30"}`}>{fmt(i.active ? (Number(i.qty) || 0) * (Number(i.price) || 0) : 0)}</span>
                </div>
              ))}
            </div>

            <div className="bg-surface rounded-lg overflow-hidden shadow-card border border-border">
              <SectionHeader emoji="💸" title="Despesas Operacionais" subtotal={despesasCost} color="#059669" />
              {despesas.map((i) => (
                <div key={i.id} className="grid grid-cols-[24px_1fr_90px_16px_90px_90px] gap-2 items-center py-2 px-4 border-b border-border/50 text-sm" style={{ opacity: i.active ? 1 : 0.4 }}>
                  <input type="checkbox" checked={i.active} onChange={() => updateItem(setDespesas, i.id, "active", !i.active)} className="w-4 h-4 rounded accent-accent cursor-pointer" />
                  <span className="text-foreground">
                    {i.name}
                    {i.id === "combustivel_evento" && <span className="text-xs text-foreground/50"> ({distKm}km × {fmt(i.price ?? 2.5)})</span>}
                  </span>
                  {i.id === "combustivel_evento" ? (
                    <>
                      <span className="text-center text-foreground/70">{distKm}km</span>
                      <span className="text-foreground/30 text-center">×</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={i.price ?? 2.5}
                        onChange={(e) => updateItem(setDespesas, i.id, "price", Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none"
                      />
                    </>
                  ) : (
                    <>
                      <input type="number" min={0} step="any" value={Number(i.qty) || 0} onChange={(e) => updateItem(setDespesas, i.id, "qty", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                      <span className="text-foreground/30 text-center">×</span>
                      <input type="number" min={0} step="any" value={Number(i.price) || 0} onChange={(e) => updateItem(setDespesas, i.id, "price", Number(e.target.value) || 0)} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-center text-sm outline-none" />
                    </>
                  )}
                  <span className="text-right font-semibold text-foreground">
                    {fmt(i.active ? (i.id === "combustivel_evento" ? distKm * (Number(i.price) || 2.5) : i.id === "combustivel" || i.id === "internet" ? Number(i.qty) || 0 : (Number(i.qty) || 0) * (Number(i.price) || 0)) : 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-6 flex flex-col gap-3">
            <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
              <div className="text-[11px] text-foreground/50 uppercase tracking-wider mb-2">Margem de Lucro</div>
              <div className="flex items-center gap-2">
                <input type="range" min={10} max={70} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="flex-1 accent-accent" />
                <span className="text-2xl font-extrabold text-accent min-w-[48px]">{margin}%</span>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 shadow-card border border-border">
              <div className="text-[11px] text-foreground/50 uppercase tracking-wider mb-3">Resumo de Custos</div>
              {[
                { label: "🍓 Frutas", value: fruitCost },
                { label: "🍫 Chocolate", value: chocCost },
                { label: "🥄 Descartáveis", value: descCost },
                { label: "🛒 Outros", value: outrosCost },
                { label: "💸 Despesas", value: despesasCost },
                { label: "⭐ Opcionais", value: opcionaisCost },
              ].map((r) => (
                <div key={r.label} className="flex justify-between py-1.5 border-b border-border/50 text-sm">
                  <span className="text-foreground/70">{r.label}</span>
                  <span className="font-semibold">{fmt(r.value)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 text-sm font-extrabold">
                <span>CUSTO TOTAL</span>
                <span>{fmt(totalCost)}</span>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-5 text-white">
              <div className="text-[11px] text-white/50 uppercase tracking-wider mb-4">Resultado Final</div>
              <div className="mb-4">
                <div className="text-[10px] text-white/50 mb-1">PREÇO DE VENDA</div>
                <div className="text-3xl font-black text-accent leading-none">{fmt(salePrice)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <div className="text-[10px] text-white/50 mb-0.5">LUCRO</div>
                  <div className="text-lg font-bold text-green-400">{fmt(profit)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50 mb-0.5">POR PESSOA</div>
                  <div className="text-lg font-bold text-white">{fmt(pricePerPerson)}</div>
                </div>
              </div>
              <div className="bg-black/40 rounded-md p-2.5 text-xs text-white/60 leading-relaxed">
                <div>👥 {guests} convidados</div>
                <div>🍓 {gramsPerPerson}g frutas + 🍫 {chocolateGrams}g chocolate</div>
                <div>🚗 {distKm}km de distância</div>
                <div>📊 Margem real: {realMargin.toFixed(1)}%</div>
              </div>

              <div className="mt-4 rounded-md p-3 text-sm" style={{ background: "#111" }}>
                <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2">Forma de Pagamento</div>
                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] text-white/50 mb-0.5">Cliente</div>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Maria Silva"
                      className="w-full px-2 py-1.5 rounded bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-white/50">Valor total</span>
                    <span className="text-white font-semibold">{fmt(salePrice)}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-white/50">Entrada</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={entryPercent}
                        onChange={(e) => setEntryPercent(Number(e.target.value) || 0)}
                        className="w-12 px-1 py-0.5 rounded bg-white/10 border border-white/20 text-accent text-sm text-center font-semibold outline-none focus:border-accent"
                      />
                      <span className="text-[10px] text-white/50">%</span>
                    </div>
                    <span className="text-accent font-semibold">{fmt(entrada)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-white/50">Restante ({100 - entryPercent}%)</span>
                    <span className="text-white font-semibold">{fmt(restante)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="text-[11px] font-bold tracking-wider text-foreground/60 uppercase mb-2">Observações</div>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                placeholder="• Item 1&#10;• Item 2"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground text-sm resize-y min-h-[80px] outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => setModalPropostaOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#5C3317", color: "#F5E6D3" }}
              >
                <span className="text-lg" aria-hidden>📄</span>
                <span className="text-xs font-semibold text-center leading-tight">Gerar Proposta</span>
              </button>
              <button
                type="button"
                onClick={() => setModalContratoOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#C4A882", color: "#1a1a1a" }}
              >
                <span className="text-lg" aria-hidden>📋</span>
                <span className="text-xs font-semibold text-center leading-tight">Gerar Contrato</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setModalComoFuncionaOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1a1a1a", color: "#ff6b2b" }}
            >
              <span className="text-lg" aria-hidden>ℹ️</span>
              <span className="text-sm font-medium">Como Funciona</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResumoModal(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1a1a1a", color: "#ff6b2b" }}
            >
              <span className="text-lg" aria-hidden>📋</span>
              <span className="text-sm font-medium">Resumo do Contrato</span>
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full py-3 rounded-lg border-2 bg-white font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#ff6b2b", color: "#ff6b2b" }}
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#ff6b2b" }}
            >
              Salvar e Confirmar
            </button>
          </div>
        </div>
      </div>

      <TextModal
        open={modalPropostaOpen}
        onClose={() => setModalPropostaOpen(false)}
        title="Proposta ChocoNick"
        text={propostaText}
        showWhatsAppButton
      />
      <ContractPdfModal
        open={modalContratoOpen}
        onClose={() => setModalContratoOpen(false)}
        eventId={editMode ? initialData?.eventId ?? null : null}
        prefill={{
          nomeCliente: clientName,
          telefone: clientPhone,
          convidados: guests,
          valorTotal: salePrice,
          valorEntrada: salePrice * 0.3,
          valorRestante: salePrice * 0.7,
        }}
        onSuccess={() => router.refresh()}
        onClientSaved={(name) => setClientName(name)}
      />
      <TextModal
        open={modalComoFuncionaOpen}
        onClose={() => setModalComoFuncionaOpen(false)}
        title="Como Funciona"
        text={COMO_FUNCIONA_TEXT}
        copySuccessMessage="Copiado!"
        showWhatsAppButton
      />
      <TextModal
        open={showResumoModal}
        onClose={() => setShowResumoModal(false)}
        title="Resumo do Contrato"
        text={getResumoContratoText()}
        copySuccessMessage="Copiado!"
        extraButtons={
          <button
            type="button"
            onClick={handleAgendarData}
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90"
            style={{ backgroundColor: "#5C3317", color: "#F5E6D3" }}
          >
            📅 Agendar Data
          </button>
        }
      />
    </div>
  );
}
