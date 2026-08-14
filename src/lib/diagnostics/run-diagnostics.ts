import type { DailyReportCounts } from "@/lib/metrics/rates";
import { detectGoalPacingFindings, type PacingIndicator } from "./goal-pacing";
import { detectFunnelBottleneck } from "./funnel-bottleneck";
import { detectRelativeDrops } from "./relative-drop";
import { detectDisciplineFindings } from "./discipline";
import { detectEffortReturnFindings, type EffortReturnActivity } from "./effort-return";
import { detectFollowupImbalance } from "./followup-balance";
import { detectStalledFunnel } from "./stalled-funnel";
import { limitFindings, type Finding } from "./types";

export type DiagnosticsInput = {
  totals: DailyReportCounts;
  previousTotals: DailyReportCounts;

  goalIndicators: PacingIndicator[];
  businessDaysElapsed: number;
  businessDaysTotal: number;

  teamRatesByStageKey: Record<string, number[]>;

  missingBusinessDays: number;
  lateCount: number;

  effortReturnActivities: EffortReturnActivity[];
  herConversion: number | null;
  teamConversions: number[];

  negotiationsOpenSeries: number[];
  salesClosedInWindow: number;
};

/** Roda as 8 regras (seção 7.4) e devolve no máximo 5 achados, mais severos primeiro. */
export function runDiagnostics(input: DiagnosticsInput): Finding[] {
  const bottleneck = detectFunnelBottleneck(input.totals, input.teamRatesByStageKey);
  const imbalance = detectFollowupImbalance(
    input.totals.followup_cold_done,
    input.totals.followup_warm_done,
    input.totals.followup_hot_done,
  );
  const stalled = detectStalledFunnel(
    input.negotiationsOpenSeries,
    input.salesClosedInWindow,
  );

  const findings: Finding[] = [
    ...detectGoalPacingFindings(
      input.goalIndicators,
      input.businessDaysElapsed,
      input.businessDaysTotal,
    ),
    ...(bottleneck ? [bottleneck] : []),
    ...detectRelativeDrops(input.totals, input.previousTotals),
    ...detectDisciplineFindings(input.missingBusinessDays, input.lateCount),
    ...detectEffortReturnFindings(
      input.effortReturnActivities,
      input.herConversion,
      input.teamConversions,
    ),
    ...(imbalance ? [imbalance] : []),
    ...(stalled ? [stalled] : []),
  ];

  return limitFindings(findings);
}
