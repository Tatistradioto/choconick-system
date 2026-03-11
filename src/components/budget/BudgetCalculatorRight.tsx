"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  getPropostaText,
  getContratoMessage,
} from "@/lib/whatsapp";
import { TextModal } from "./TextModal";
import { COMO_FUNCIONA_TEXT } from "@/lib/comoFuncionaText";

type Props = {
  marginPercent: number;
  setMarginPercent: (v: number) => void;
  costFrutas: number;
  costChocolate: number;
  costDescartaveis: number;
  costOutros: number;
  costOpcionais: number;
  costDespesas: number;
  totalCost: number;
  salePrice: number;
  profit: number;
  pricePerPerson: number;
  guests: number;
  gramasFrutas: number;
  gramasChocolate: number;
  distanceKm: number;
  realMargin: number;
  onSave: (andConfirm: boolean) => void;
  saving: boolean;
  clientPhone: string;
  clientName: string;
  eventId: string | null;
  eventDate?: string; // "YYYY-MM-DD" ou vazio
  numeroOrcamento?: string;
  dataOrcamento?: string; // ex: "06/03/2025"
};

function formatDateStr(iso: string) {
  if (!iso) return "A definir";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function BudgetCalculatorRight(props: Props) {
  const {
    marginPercent,
    setMarginPercent,
    costFrutas,
    costChocolate,
    costDescartaveis,
    costOutros,
    costOpcionais,
    costDespesas,
    totalCost,
    salePrice,
    profit,
    pricePerPerson,
    guests,
    gramasFrutas,
    gramasChocolate,
    distanceKm,
    realMargin,
    onSave,
    saving,
    clientPhone,
    clientName,
    eventDate = "",
    numeroOrcamento,
    dataOrcamento,
  } = props;

  const [modalPropostaOpen, setModalPropostaOpen] = useState(false);
  const [modalContratoOpen, setModalContratoOpen] = useState(false);
  const [modalComoFuncionaOpen, setModalComoFuncionaOpen] = useState(false);

  const valorEntrada = salePrice * 0.3;
  const propostaText = getPropostaText({
    convidados: guests,
    valorTotal: salePrice,
    valorEntrada,
    numeroOrcamento,
    dataOrcamento,
    nomeCliente: clientName || undefined,
  });
  const contratoMessage = getContratoMessage({
    nomeCliente: clientName || "Cliente",
    dataEvento: formatDateStr(eventDate),
    convidados: guests,
    valorTotal: salePrice,
  });

  return (
    <div className="lg:sticky lg:top-6 space-y-4">
      <div className="bg-surface rounded-xl border border-border shadow-card p-5">
        <label className="block text-sm font-medium text-foreground mb-2">
          Margem de lucro: {marginPercent}%
        </label>
        <input
          type="range"
          min={10}
          max={70}
          value={marginPercent}
          onChange={(e) => setMarginPercent(Number(e.target.value))}
          className="w-full accent-accent"
        />

        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-foreground/70">
            <span>🍓 Frutas</span>
            <span className="font-mono">R$ {costFrutas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-foreground/70">
            <span>🍫 Chocolate</span>
            <span className="font-mono">R$ {costChocolate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-foreground/70">
            <span>🥄 Descartáveis</span>
            <span className="font-mono">R$ {costDescartaveis.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-foreground/70">
            <span>🛒 Outros</span>
            <span className="font-mono">R$ {costOutros.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          {costOpcionais > 0 && (
            <div className="flex justify-between text-accent">
              <span>⭐ Opcionais</span>
              <span className="font-mono">R$ {costOpcionais.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-foreground/70">
            <span>💸 Despesas</span>
            <span className="font-mono">R$ {costDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-2xl font-bold text-accent text-center">
            R$ {salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-center text-sm text-foreground/70 mt-0.5">Preço de venda</p>
          <div className="mt-2 text-lg font-semibold text-green-600 text-center">
            Lucro: R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-sm text-foreground/80 text-center">
            Por pessoa: <span className="font-mono font-medium">R$ {pricePerPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-xs text-foreground/60 space-y-1">
          <p>Convidados: {guests}</p>
          <p>g frutas/pessoa: {gramasFrutas} · g chocolate/pessoa: {gramasChocolate}</p>
          <p>Distância: {distanceKm} km</p>
          <p>Margem real: {realMargin.toFixed(1)}%</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
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

        <div className="mt-3 flex flex-col gap-2">
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
            onClick={() => onSave(false)}
            disabled={saving}
            className="w-full py-3 rounded-lg border-2 bg-white font-medium hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#ff6b2b", color: "#ff6b2b" }}
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => onSave(true)}
            disabled={saving}
            className="w-full py-3 rounded-lg font-medium text-white hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#ff6b2b" }}
          >
            Salvar e Confirmar
          </button>
        </div>
      </div>

      <TextModal
        open={modalPropostaOpen}
        onClose={() => setModalPropostaOpen(false)}
        title="Proposta ChocoNick"
        text={propostaText}
        showWhatsAppButton
      />
      <TextModal
        open={modalContratoOpen}
        onClose={() => setModalContratoOpen(false)}
        title="Contrato ChocoNick"
        text={contratoMessage}
        showWhatsAppButton
      />
      <TextModal
        open={modalComoFuncionaOpen}
        onClose={() => setModalComoFuncionaOpen(false)}
        title="Como Funciona"
        text={COMO_FUNCIONA_TEXT}
        copySuccessMessage="Copiado!"
        showWhatsAppButton
      />
    </div>
  );
}
