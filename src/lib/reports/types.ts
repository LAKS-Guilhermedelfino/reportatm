import type { DailyReportCounts } from "@/lib/metrics/rates";
import type { FillRate } from "@/lib/metrics/period-aggregation";
import type { Finding } from "@/lib/diagnostics/types";
import type { GoalIndicatorKey } from "@/lib/metrics/goal-indicators";

export type ResolvedGoal = Record<GoalIndicatorKey, number | null> | null;

export type IndividualReportData = {
  companyName: string;
  consultantName: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totals: DailyReportCounts;
  goal: ResolvedGoal;
  fillRate: FillRate;
  findings: Finding[];
};

export type TeamConsultantSummary = {
  fullName: string;
  totals: DailyReportCounts;
};

export type TeamReportData = {
  companyName: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  teamTotals: DailyReportCounts;
  teamFillRate: FillRate;
  consultants: TeamConsultantSummary[];
  aggregatedFindings: Finding[];
  topAttention: { fullName: string; reason: string }[];
};
