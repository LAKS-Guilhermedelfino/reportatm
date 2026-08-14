import { Card, CardContent } from "@/components/ui/card";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { averageTicketCents, type DailyReportCounts } from "@/lib/metrics/rates";
import type { FillRate } from "@/lib/metrics/period-aggregation";
import { GOAL_INDICATORS, type GoalIndicatorKey } from "@/lib/metrics/goal-indicators";
import { goalAttainment, goalStatus } from "@/lib/metrics/goals";
import { GOAL_STATUS_DISPLAY } from "@/lib/metrics/goal-status-display";

export type ResolvedGoal = Record<GoalIndicatorKey, number | null> | null;

export function KpiCards({
  totals,
  fillRate,
  goal,
  businessDaysElapsed,
  businessDaysTotal,
}: {
  totals: DailyReportCounts;
  fillRate: FillRate;
  goal?: ResolvedGoal;
  businessDaysElapsed?: number;
  businessDaysTotal?: number;
}) {
  const ticket = averageTicketCents(totals);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GOAL_INDICATORS.map((indicator) => {
          const realizado = indicator.realizado(totals);
          const meta = goal ? (goal[indicator.key] ?? null) : null;
          const attainment = goalAttainment(realizado, meta);
          const status =
            businessDaysElapsed !== undefined && businessDaysTotal !== undefined
              ? goalStatus(realizado, meta, businessDaysElapsed, businessDaysTotal)
              : "sem-meta";
          const display = GOAL_STATUS_DISPLAY[status];
          const Icon = display.icon;

          return (
            <Card key={indicator.key}>
              <CardContent className="space-y-1.5 pt-4">
                <p className="text-xs text-muted-foreground">{indicator.label}</p>
                <p className="heading text-xl text-foreground">
                  {indicator.isMoney ? formatBRLCents(realizado) : realizado}
                </p>
                <p className="text-xs text-muted-foreground">
                  Meta:{" "}
                  {meta === null
                    ? "—"
                    : indicator.isMoney
                      ? formatBRLCents(meta)
                      : meta}
                  {attainment !== null && ` · ${formatPercent(attainment)}`}
                </p>
                <p className={`flex items-center gap-1 text-xs ${display.textClass}`}>
                  <Icon className="size-3" />
                  {display.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 pt-4">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="heading text-xl text-foreground">
              {ticket === null ? "—" : formatBRLCents(ticket)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-4">
            <p className="text-xs text-muted-foreground">Taxa de preenchimento</p>
            <p className="heading text-xl text-foreground">
              {formatPercent(fillRate.rate)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {fillRate.filledBusinessDays}/{fillRate.totalBusinessDays} dias úteis
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
