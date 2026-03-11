"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ConfirmBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<{ budget_number: string; contract_number: string | null; status: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("budget_number, contract_number, status").eq("id", id).single();
      setEvent(data || null);
    })();
  }, [id, supabase]);

  async function handleConfirm() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para continuar");
      setLoading(false);
      return;
    }
    const { data: ev } = await supabase.from("events").select("id").eq("id", id).single();
    if (!ev) {
      toast.error("Evento não encontrado");
      setLoading(false);
      return;
    }
    let contractNum: string | null = null;
    try {
      const res = await supabase.rpc("next_contract_number");
      contractNum = res.data as string | null;
    } catch {
      const y = new Date().getFullYear();
      const { data: eventsThisYear } = await supabase.from("events").select("id").eq("user_id", user.id).gte("created_at", `${y}-01-01`);
      const eventIds = (eventsThisYear ?? []).map((e) => e.id);
      if (eventIds.length === 0) {
        contractNum = `CTR-${y}-001`;
      } else {
        const { count } = await supabase.from("contracts").select("id", { count: "exact", head: true }).in("event_id", eventIds);
        contractNum = `CTR-${y}-${String((count ?? 0) + 1).padStart(3, "0")}`;
      }
    }
    const { error: updateErr } = await supabase
      .from("events")
      .update({ status: "contrato_gerado", contract_number: contractNum })
      .eq("id", id);
    if (updateErr) {
      toast.error(updateErr.message);
      setLoading(false);
      return;
    }
    await supabase.from("contracts").insert({ event_id: id });
    toast.success("Contrato gerado com sucesso.");
    router.push(`/budget/${id}`);
    router.refresh();
    setLoading(false);
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto text-center py-12 text-foreground/70">
        Carregando…
      </div>
    );
  }

  if (event.status !== "orcamento") {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-foreground mb-4">Este evento já possui contrato gerado ou não é um rascunho.</p>
        <Link href={`/budget/${id}`} className="text-accent hover:underline">
          Voltar ao orçamento
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href={`/budget/${id}`} className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">Confirmar orçamento</h1>
        <p className="text-foreground/80 text-sm mb-6">
          Ao confirmar, o status do evento será alterado para <strong>Contrato Gerado</strong> e um
          número de contrato será gerado. O cliente poderá assinar o contrato.
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Confirmando…" : "Confirmar e gerar contrato"}
        </button>
      </div>
    </div>
  );
}
