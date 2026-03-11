"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getPropostaText } from "@/lib/whatsapp";
import { TextModal } from "./TextModal";
import { ContractPdfModal } from "./ContractPdfModal";
import { COMO_FUNCIONA_TEXT } from "@/lib/comoFuncionaText";

type Props = {
  eventId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  eventDate: string | null;
  guestsCount: number;
  salePrice: number | null;
  status: string;
  budgetNumber?: string | null;
};

export function BudgetActions({
  eventId,
  clientName,
  clientPhone,
  clientEmail,
  eventDate,
  guestsCount,
  salePrice,
  status,
  budgetNumber,
}: Props) {
  const router = useRouter();
  const [modalPropostaOpen, setModalPropostaOpen] = useState(false);
  const [modalContratoOpen, setModalContratoOpen] = useState(false);
  const [modalComoFuncionaOpen, setModalComoFuncionaOpen] = useState(false);
  const [showResumoModal, setShowResumoModal] = useState(false);

  const valorTotal = salePrice ?? 0;
  const valorEntrada = valorTotal * 0.3;
  const valorRestante = valorTotal - valorEntrada;

  const propostaText = getPropostaText({
    convidados: guestsCount,
    valorTotal,
    valorEntrada,
    numeroOrcamento: budgetNumber ?? undefined,
    dataOrcamento: eventDate ? format(eventDate, "dd/MM/yyyy", { locale: ptBR }) : undefined,
    nomeCliente: clientName || undefined,
  });

  function getResumoContratoText() {
    const nomeCliente = clientName ?? "";
    const cpfCnpj = "—";
    const telefone = clientPhone ?? "";
    const enderecoCliente = "—";
    const localEvento = "—";
    const convidados = guestsCount;
    const horarioEvento = "—";
    const tempoEvento = 4;
    const dataEvento = eventDate != null ? (typeof eventDate === "string" ? eventDate : format(new Date(eventDate), "yyyy-MM-dd")) : "";
    const entradaPercent = 30;
    const mesaTamanho = 2.5;

    const fmt = (v: number) =>
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

    const entradaValor = valorEntrada || (valorTotal * (entradaPercent || 30)) / 100;
    const restanteValor = valorRestante || valorTotal - entradaValor;

    const calcHorarioFim = () => {
      try {
        const [h, m] = (horarioEvento || "00:00").split(":").map(Number);
        const d = new Date(2000, 0, 1, h, m);
        d.setHours(d.getHours() + (tempoEvento || 4));
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

    const formatDataBR = (iso: string) => {
      try {
        const s = (iso || "").trim();
        if (!s) return "—";
        const d = s.includes("T") ? new Date(s) : new Date(`${s}T12:00:00`);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      } catch { return "—"; }
    };

    return [
      "📋 RESUMO DO CONTRATO – CHOCONICK FONDUE",
      "",
      "👤 CONTRATANTE",
      `Nome: ${nomeCliente || "—"}`,
      `CPF/CNPJ: ${cpfCnpj || "—"}`,
      `Telefone: ${telefone || "—"}`,
      `Endereço: ${enderecoCliente || "—"}`,
      "",
      "⚠️ PONTOS IMPORTANTES",
      "",
      `📍 Local do evento: ${localEvento || "—"}`,
      `👥 Número de convidados: ${convidados || "—"}`,
      `⏱️ Duração: ${tempoEvento || 4}h — das ${horarioEvento || "—"} às ${calcHorarioFim()}`,
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
      `• Fornecer mesa firme com no mínimo ${mesaTamanho || 2.5}m de comprimento`,
      "• Mesa não pode estar em local com corrente de ar ou ventania",
      "• Disponibilizar ponto de energia próximo à mesa",
      "• Liberar acesso ao local 3h antes do evento para montagem",
      "",
      "⚠️ O fondue é calculado para eventos com estrutura equilibrada:",
      "Entrada → Almoço/Jantar → Bebidas → Bolo",
      "Sem essa estrutura, o tempo de serviço pode reduzir para menos de 4 horas.",
      "Não trabalhamos com reposição de produtos.",
    ].join("\n");
  }

  const handleAgendarData = async () => {
    const nomeCliente = clientName ?? "";
    const cpfCnpj = "";
    const endereco = "";
    const telefone = clientPhone ?? "";
    const email = clientEmail ?? "";
    const dataEvento = eventDate != null ? (typeof eventDate === "string" ? eventDate : format(new Date(eventDate), "yyyy-MM-dd")) : "";
    const horarioEvento = "";
    const localEvento = "";
    const convidados = guestsCount;
    const valorTotal = salePrice ?? 0;
    const valorEntrada = valorTotal * 0.3;
    const valorRestante = valorTotal - valorEntrada;
    const entradaPercent = 30;
    const calculatorSnapshot = null;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar.");
        return;
      }

      let selectedClientId: string | null = null;
      if (eventId) {
        const { data: ev } = await supabase.from("events").select("client_id").eq("id", eventId).single();
        selectedClientId = ev?.client_id ?? null;
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

      if (eventId) {
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
        }).eq("id", eventId);
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
    <div className="bg-surface border border-border rounded-xl p-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">Ações</h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setModalPropostaOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#5C3317", color: "#F5E6D3" }}
        >
          <span className="text-xl" aria-hidden>📄</span>
          <span className="text-sm font-medium text-center">Gerar Proposta</span>
        </button>

        <button
          type="button"
          onClick={() => setModalContratoOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 py-3 px-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#C4A882", color: "#1a1a1a" }}
        >
          <span className="text-xl" aria-hidden>📋</span>
          <span className="text-sm font-medium text-center">Gerar Contrato</span>
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
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
          className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#1a1a1a", color: "#ff6b2b" }}
        >
          <span className="text-lg" aria-hidden>📋</span>
          <span className="text-sm font-medium">Resumo do Contrato</span>
        </button>
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
        eventId={eventId}
        prefill={{
          nomeCliente: clientName,
          telefone: clientPhone,
          email: clientEmail,
          convidados: guestsCount,
          valorTotal,
          valorEntrada,
          valorRestante,
          dataEvento: eventDate ? format(new Date(eventDate), "yyyy-MM-dd") : undefined,
        }}
        onSuccess={() => router.refresh()}
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
