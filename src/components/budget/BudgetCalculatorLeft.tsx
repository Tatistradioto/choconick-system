"use client";

import type { FruitLine, LineItem, OptionalItem, OperationalExpense } from "./calculator-types";

type Props = {
  fruitsWithTotals: FruitLine[];
  updateFruit: (id: string, field: "unitPrice" | "percentageMix", value: number) => void;
  guests: number;
  gramasChocolate: number;
  chocolatePricePerKg: number;
  setChocolatePricePerKg: (v: number) => void;
  descartaveis: LineItem[];
  updateDescartaveis: (id: string, updates: Partial<LineItem>) => void;
  outros: LineItem[];
  updateOutros: (id: string, updates: Partial<LineItem>) => void;
  opcionais: OptionalItem[];
  updateOpcionais: (id: string, updates: Partial<OptionalItem>) => void;
  despesas: OperationalExpense[];
  updateDespesas: (id: string, updates: Partial<OperationalExpense>) => void;
  distanceKm: number;
};

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-xl border border-border shadow-card p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

export function BudgetCalculatorLeft(props: Props) {
  const {
    fruitsWithTotals,
    updateFruit,
    guests,
    gramasChocolate,
    chocolatePricePerKg,
    setChocolatePricePerKg,
    descartaveis,
    updateDescartaveis,
    outros,
    updateOutros,
    opcionais,
    updateOpcionais,
    despesas,
    updateDespesas,
    distanceKm,
  } = props;

  const kgChocolate = (guests * gramasChocolate) / 1000;

  return (
    <>
      <Section title="Frutas" icon="🍓">
        {fruitsWithTotals.length === 0 ? (
          <p className="text-sm text-foreground/60">Cadastre frutas no módulo Ingredientes (categoria frutas, com % na mistura).</p>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/70 border-b border-border">
              <th className="pb-2 pr-2">Fruta</th>
              <th className="pb-2 pr-2 w-20">% mix</th>
              <th className="pb-2 pr-2 w-20">kg</th>
              <th className="pb-2 pr-2 w-24">R$/kg</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {fruitsWithTotals.map((f) => (
              <tr key={f.id} className="border-b border-border/50">
                <td className="py-1.5">{f.name}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={f.percentageMix}
                    onChange={(e) => updateFruit(f.id, "percentageMix", Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td className="font-mono text-right">{f.calculatedKg.toFixed(2)}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={f.unitPrice}
                    onChange={(e) => updateFruit(f.id, "unitPrice", Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td className="font-mono text-right">R$ {f.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </Section>

      <Section title="Chocolate" icon="🍫">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-foreground/70 text-sm">Quantidade: </span>
            <span className="font-mono font-medium">{kgChocolate.toFixed(2)} kg</span>
            <span className="text-foreground/60 text-xs ml-1">({guests} × {gramasChocolate}g)</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-foreground/70">R$/kg</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={chocolatePricePerKg}
              onChange={(e) => setChocolatePricePerKg(Number(e.target.value) || 0)}
              className="w-24 px-2 py-1.5 rounded border border-border bg-background text-foreground text-right"
            />
          </div>
        </div>
      </Section>

      <Section title="Descartáveis" icon="🥄">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/70 border-b border-border">
              <th className="pb-2 pr-2 w-8"></th>
              <th className="pb-2 pr-2">Item</th>
              <th className="pb-2 pr-2 w-20">Qtd</th>
              <th className="pb-2 pr-2 w-24">Preço</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {descartaveis.map((d) => (
              <tr key={d.id} className="border-b border-border/50">
                <td className="py-1.5">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => updateDescartaveis(d.id, { enabled: e.target.checked })}
                    className="rounded border-border"
                  />
                </td>
                <td>{d.label}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={d.quantity}
                    onChange={(e) => updateDescartaveis(d.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={d.unitPrice}
                    onChange={(e) => updateDescartaveis(d.id, { unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td className="font-mono text-right">{d.enabled ? (d.quantity * d.unitPrice).toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Outros Itens" icon="🛒">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/70 border-b border-border">
              <th className="pb-2 pr-2 w-8"></th>
              <th className="pb-2 pr-2">Item</th>
              <th className="pb-2 pr-2 w-20">Qtd</th>
              <th className="pb-2 pr-2 w-24">Preço</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {outros.map((o) => (
              <tr key={o.id} className="border-b border-border/50">
                <td className="py-1.5">
                  <input
                    type="checkbox"
                    checked={o.enabled}
                    onChange={(e) => updateOutros(o.id, { enabled: e.target.checked })}
                    className="rounded border-border"
                  />
                </td>
                <td>{o.label}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    value={o.quantity}
                    onChange={(e) => updateOutros(o.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={o.unitPrice}
                    onChange={(e) => updateOutros(o.id, { unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                  />
                </td>
                <td className="font-mono text-right">{o.enabled ? (o.quantity * o.unitPrice).toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Opcionais do Cliente" icon="⭐">
        <div className="border-2 border-dashed border-accent/50 rounded-lg p-3 bg-accent/5">
          <span className="text-xs font-medium text-accent bg-accent/20 px-2 py-0.5 rounded">Cliente escolhe se quer</span>
          <div className="mt-3 space-y-2">
            {opcionais.map((o) => (
              <div key={o.id} className="flex items-center gap-3 flex-wrap">
                <input
                  type="checkbox"
                  checked={o.enabled}
                  onChange={(e) => updateOpcionais(o.id, { enabled: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-sm">{o.label}</span>
                {o.unit === "hora" ? (
                  <input
                    type="number"
                    min={0}
                    value={o.quantity}
                    onChange={(e) => updateOpcionais(o.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-right text-sm"
                  />
                ) : null}
                <span className="text-sm text-foreground/70">R$ {o.unitPrice.toFixed(2)}{o.unit === "hora" ? "/h" : ""}</span>
                {o.enabled && <span className="font-mono text-sm">= R$ {(o.quantity * o.unitPrice).toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Despesas Operacionais" icon="💸">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-foreground/70 border-b border-border">
              <th className="pb-2 pr-2 w-8"></th>
              <th className="pb-2 pr-2">Item</th>
              <th className="pb-2 pr-2 w-20">Qtd/Valor</th>
              <th className="pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => {
              let total = 0;
              if (d.type === "fixed") total = d.value;
              else if (d.type === "per_km") total = distanceKm * d.value;
              else if (d.type === "per_unit") total = (d.quantity ?? 0) * d.value;
              return (
                <tr key={d.id} className="border-b border-border/50">
                  <td className="py-1.5">
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={(e) => updateDespesas(d.id, { enabled: e.target.checked })}
                      className="rounded border-border"
                    />
                  </td>
                  <td>{d.label}</td>
                  <td>
                    {d.type === "fixed" && <input type="number" min={0} step={0.01} value={d.value} onChange={(e) => updateDespesas(d.id, { value: Number(e.target.value) || 0 })} className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-right" />}
                    {d.type === "per_km" && <span className="text-foreground/70">{distanceKm} km × R$ {d.value}</span>}
                    {d.type === "per_unit" && (
                      <input
                        type="number"
                        min={0}
                        value={d.quantity ?? 0}
                        onChange={(e) => updateDespesas(d.id, { quantity: Number(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-right"
                      />
                    )}
                  </td>
                  <td className="font-mono text-right">{d.enabled ? `R$ ${total.toFixed(2)}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </>
  );
}
