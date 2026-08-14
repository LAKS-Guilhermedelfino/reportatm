"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/chart-colors";

export type DailyPoint = {
  date: string;
  dateLabel: string;
  calls_made: number | null;
  meetings_held: number | null;
  followup_total: number | null;
  sales_closed: number | null;
};

const METRICS: { key: keyof Omit<DailyPoint, "date" | "dateLabel">; label: string }[] = [
  { key: "calls_made", label: "Ligações realizadas" },
  { key: "followup_total", label: "Follow-ups feitos" },
  { key: "meetings_held", label: "Reuniões realizadas" },
  { key: "sales_closed", label: "Vendas fechadas" },
];

export function EvolutionChart({ data }: { data: DailyPoint[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>(
    "calls_made",
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="heading text-base">Evolução diária</CardTitle>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as typeof metric)}
          className="h-8 rounded-sm border border-input bg-transparent px-2 text-sm"
          aria-label="Indicador do gráfico"
        >
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
                formatter={(value) => [value ?? "sem report", ""]}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_COLORS.primary }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Dias sem preenchimento aparecem como lacuna na linha, não como zero.
        </p>
      </CardContent>
    </Card>
  );
}
