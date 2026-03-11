"use client";

import type { WizardEventData, PaymentData } from "./BudgetWizard";
import type { CostRow } from "./BudgetWizard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Props = {
  eventData: WizardEventData;
  costRows: CostRow[];
  totalCost: number;
  salePrice: number;
  profit: number;
  pricePerPerson: number;
  payment: PaymentData;
  entryValue: number;
  restValue: number;
  notes: string;
  setNotes: (s: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  saving: boolean;
};

export function Step4Review({
  eventData,
  costRows,
  totalCost,
  salePrice,
  profit,
  pricePerPerson,
  payment,
  entryValue,
  restValue,
  notes,
  setNotes,
  onBack,
  onSaveDraft,
  saving,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Resumo do orçamento</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <dt className="text-foreground/70">Cliente</dt>
          <dd className="font-medium text-foreground">{eventData.clientName || "—"}</dd>
          <dt className="text-foreground/70">Data / Horário</dt>
          <dd className="text-foreground">
            {eventData.eventDate ? format(eventData.eventDate, "dd/MM/yyyy", { locale: ptBR }) : "—"}
            {eventData.eventTime ? ` ${eventData.eventTime.slice(0, 5)}` : ""}
          </dd>
          <dt className="text-foreground/70">Local</dt>
          <dd className="text-foreground">
            {[eventData.eventAddress, eventData.eventCity].filter(Boolean).join(", ") || "—"}
          </dd>
          <dt className="text-foreground/70">Convidados</dt>
          <dd className="font-mono text-foreground">{eventData.guestsCount}</dd>
          <dt className="text-foreground/70">Custo total</dt>
          <dd className="font-mono text-foreground">
            R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </dd>
          <dt className="text-foreground/70">Preço de venda</dt>
          <dd className="font-mono text-accent text-lg">
            R$ {salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </dd>
          <dt className="text-foreground/70">Por pessoa</dt>
          <dd className="font-mono text-foreground">
            R$ {pricePerPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </dd>
          <dt className="text-foreground/70">Entrada</dt>
          <dd className="font-mono text-foreground">
            R$ {entryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ({payment.entryPercent}%)
          </dd>
          <dt className="text-foreground/70">Restante</dt>
          <dd className="font-mono text-foreground">
            R$ {restValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} até{" "}
            {payment.restDate
              ? format(payment.restDate, "dd/MM/yyyy", { locale: ptBR })
              : "—"}
          </dd>
          <dt className="text-foreground/70">Forma de pagamento</dt>
          <dd className="text-foreground">{payment.paymentMethod}</dd>
        </dl>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Notas internas"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar como rascunho"}
        </button>
        <span className="text-sm text-foreground/60 self-center">
          PDF, WhatsApp e Contrato serão disponibilizados na tela do orçamento após salvar.
        </span>
      </div>
    </div>
  );
}
