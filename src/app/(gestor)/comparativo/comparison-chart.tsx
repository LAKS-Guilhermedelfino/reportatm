"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/chart-colors";
import { GOAL_INDICATORS, type GoalIndicatorKey } from "@/lib/metrics/goal-indicators";
import { formatBRLCents } from "@/lib/format/currency";
import type { DailyReportCounts } from "@/lib/metrics/rates";

export function ComparisonChart({
  consultants,
}: {
  consultants: { id: string; fullName: string; totals: DailyReportCounts }[];
}) {
  const [indicatorKey, setIndicatorKey] = useState<GoalIndicatorKey>(
    GOAL_INDICATORS[3].key, // Ligações realizadas
  );
  const indicator = GOAL_INDICATORS.find((i) => i.key === indicatorKey)!;

  const data = consultants.map((c) => ({
    name: c.fullName,
    value: indicator.realizado(c.totals),
  }));

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="heading text-base">
          Comparação por indicador
        </CardTitle>
        <select
          value={indicatorKey}
          onChange={(e) => setIndicatorKey(e.target.value as GoalIndicatorKey)}
          className="h-8 rounded-sm border border-input bg-transparent px-2 text-sm"
          aria-label="Indicador do gráfico"
        >
          {GOAL_INDICATORS.map((i) => (
            <option key={i.key} value={i.key}>
              {i.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={indicator.isMoney ? 64 : 32}
                tickFormatter={(v) => (indicator.isMoney ? formatBRLCents(v) : String(v))}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-2)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
                formatter={(value) => [
                  indicator.isMoney ? formatBRLCents(Number(value)) : value,
                  indicator.label,
                ]}
              />
              <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
