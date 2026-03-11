"use client";

import type { PaymentData } from "./BudgetWizard";

type Props = {
  payment: PaymentData;
  setPayment: (p: PaymentData) => void;
  salePrice: number;
  entryValue: number;
  restValue: number;
  eventDate: string;
  onNext: () => void;
  onBack: () => void;
};

export function Step3Payment({
  payment,
  setPayment,
  salePrice,
  entryValue,
  restValue,
  eventDate,
  onNext,
  onBack,
}: Props) {
  const restDateDefault = eventDate || new Date().toISOString().slice(0, 10);
  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Condições de pagamento</h2>

      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Entrada (%)</label>
        <input
          type="number"
          min={0}
          max={100}
          value={payment.entryPercent}
          onChange={(e) =>
            setPayment({
              ...payment,
              entryPercent: parseInt(e.target.value, 10) || 0,
              entryValue: 0,
            })
          }
          className="w-24 px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono"
        />
        <p className="mt-1 text-sm text-foreground/70">
          Valor da entrada: R$ {entryValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">
          Restante: R$ {restValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </label>
        <label className="block text-sm text-foreground/70 mb-1">Data para pagamento do restante</label>
        <input
          type="date"
          value={payment.restDate || restDateDefault}
          onChange={(e) => setPayment({ ...payment, restDate: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Forma de pagamento</label>
        <select
          value={payment.paymentMethod}
          onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
        >
          <option value="PIX">PIX</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão</option>
          <option value="Transferência">Transferência</option>
        </select>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
