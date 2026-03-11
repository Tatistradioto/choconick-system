"use client";

import type { CostRow } from "./BudgetWizard";

type Props = {
  costRows: CostRow[];
  setCostRows: (rows: CostRow[]) => void;
  margin: number;
  setMargin: (n: number) => void;
  totalCost: number;
  salePrice: number;
  salePriceOverride: number | null;
  setSalePriceOverride: (n: number | null) => void;
  suggestedSalePrice: number;
  profit: number;
  pricePerPerson: number;
  guestsCount: number;
  onNext: () => void;
  onBack: () => void;
};

export function Step2Costs({
  costRows,
  setCostRows,
  margin,
  setMargin,
  totalCost,
  salePrice,
  salePriceOverride,
  setSalePriceOverride,
  suggestedSalePrice,
  profit,
  pricePerPerson,
  guestsCount,
  onNext,
  onBack,
}: Props) {
  function updateRow(index: number, field: "quantityKg" | "unitPrice", value: number) {
    const next = [...costRows];
    const row = next[index];
    if (!row) return;
    row[field] = value;
    row.totalPrice = Math.round(row.quantityKg * row.unitPrice * 100) / 100;
    setCostRows(next);
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Calculadora de custos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground/70">
                <th className="p-2 font-medium">Item</th>
                <th className="p-2 font-medium">Qtd</th>
                <th className="p-2 font-medium">Preço un.</th>
                <th className="p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {costRows.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-2 text-foreground">{row.name}</td>
                  <td className="p-2">
                    {row.isFixed ? (
                      <span className="font-mono">{row.quantityKg}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={0.001}
                        value={row.quantityKg}
                        onChange={(e) => updateRow(i, "quantityKg", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 rounded bg-background border border-border text-foreground font-mono text-right"
                      />
                    )}
                  </td>
                  <td className="p-2">
                    {row.isFixed ? (
                      <span className="font-mono">R$ {row.unitPrice.toFixed(2)}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.unitPrice}
                        onChange={(e) => updateRow(i, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 rounded bg-background border border-border text-foreground font-mono text-right"
                      />
                    )}
                  </td>
                  <td className="p-2 font-mono text-foreground">
                    R$ {row.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-2">
            Margem de lucro: {margin}%
          </label>
          <input
            type="range"
            min={10}
            max={80}
            value={margin}
            onChange={(e) => setMargin(parseInt(e.target.value, 10))}
            className="w-full accent-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-foreground/70">Custo total</span>
            <p className="font-mono text-lg text-foreground">
              R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <span className="text-foreground/70">Preço de venda (sugerido)</span>
            <p className="font-mono text-lg text-foreground">
              R$ {suggestedSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <label className="text-foreground/70">Preço final (editar se quiser)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={salePriceOverride ?? suggestedSalePrice}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSalePriceOverride(isNaN(v) ? null : v);
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground font-mono"
            />
          </div>
          <div>
            <span className="text-foreground/70">Lucro</span>
            <p className="font-mono text-lg text-green-400">
              R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <span className="text-foreground/70">Preço por pessoa ({guestsCount} conv.)</span>
            <p className="font-mono text-lg text-accent">
              R$ {pricePerPerson.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
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
