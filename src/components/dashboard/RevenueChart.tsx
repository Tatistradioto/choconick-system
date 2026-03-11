"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type DataItem = { month: string; faturamento: number };

export function RevenueChart({ data }: { data: DataItem[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--foreground)" fontSize={12} />
          <YAxis stroke="var(--foreground)" fontSize={12} tickFormatter={(v) => `R$ ${v / 1000}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="faturamento" fill="#ff6b2b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
