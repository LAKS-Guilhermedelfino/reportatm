import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  adjacentPeriod,
  countBusinessDays,
  type Period,
  type PeriodType,
} from "@/lib/dates/periods";
import { subDaysISO } from "@/lib/dates/sao-paulo";
import { aggregateReports } from "@/lib/metrics/period-aggregation";
import {
  callAnswerRate,
  callToMeetingRate,
  followupTotalDone,
  meetingAttendanceRate,
  meetingToProposalRate,
  proposalToSaleRate,
  type DailyReportCounts,
} from "@/lib/metrics/rates";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { loadTeamData, type ConsultantTeamData } from "@/lib/dashboard/team-data";
import { formatBRLCents } from "@/lib/format/currency";
import type { DiagnosticsInput } from "./run-diagnostics";
import type { PacingIndicator } from "./goal-pacing";
import type { EffortReturnActivity } from "./effort-return";

type DailyReportRow = Database["public"]["Tables"]["daily_reports"]["Row"];

function toCounts(r: DailyReportRow): DailyReportCounts {
  const {
    new_leads_received, new_leads_contacted, old_leads_contacted, old_leads_replied,
    followup_cold_done, followup_cold_replied, followup_warm_done, followup_warm_replied,
    followup_hot_done, followup_hot_replied, calls_made, calls_answered,
    meetings_scheduled, meetings_held, quotes_sent, negotiations_open,
    proposals_submitted, sales_closed, sales_amount_cents,
  } = r;
  return {
    new_leads_received, new_leads_contacted, old_leads_contacted, old_leads_replied,
    followup_cold_done, followup_cold_replied, followup_warm_done, followup_warm_replied,
    followup_hot_done, followup_hot_replied, calls_made, calls_answered,
    meetings_scheduled, meetings_held, quotes_sent, negotiations_open,
    proposals_submitted, sales_closed, sales_amount_cents,
  };
}

function overallConversion(t: DailyReportCounts): number | null {
  return t.calls_made > 0 ? t.sales_closed / t.calls_made : null;
}

const STAGE_RATE_FNS: Record<string, (t: DailyReportCounts) => number | null> = {
  call_answer: callAnswerRate,
  call_to_meeting: callToMeetingRate,
  attendance: meetingAttendanceRate,
  meeting_to_proposal: meetingToProposalRate,
  proposal_to_sale: proposalToSaleRate,
};

export async function loadDiagnosticsInput(
  supabase: SupabaseClient<Database>,
  companyId: string,
  consultantId: string,
  periodType: PeriodType,
  period: Period,
  today: string,
): Promise<DiagnosticsInput> {
  const teamData = await loadTeamData(supabase, companyId, periodType, period);

  const [{ data: ownReports }, { data: goalRow }, { data: trailingReports }] =
    await Promise.all([
      supabase
        .from("daily_reports")
        .select("*")
        .eq("consultant_id", consultantId)
        .gte("report_date", period.start)
        .lte("report_date", period.end),
      periodType !== "custom"
        ? supabase
            .from("goals")
            .select(GOAL_INDICATORS.map((i) => i.key).join(","))
            .eq("company_id", companyId)
            .eq("consultant_id", consultantId)
            .eq("period_type", periodType)
            .eq("period_start", period.start)
            .eq("period_end", period.end)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("daily_reports")
        .select("report_date, negotiations_open, sales_closed")
        .eq("consultant_id", consultantId)
        .gte("report_date", subDaysISO(today, 9))
        .lte("report_date", today)
        .order("report_date"),
    ]);

  const totals = aggregateReports((ownReports ?? []).map(toCounts));
  const filledDates = new Set((ownReports ?? []).map((r) => r.report_date));
  // Falha de disciplina só existe pra dia que já passou — dia útil futuro
  // dentro do período (ex.: resto do mês corrente) não é "falta" de
  // ninguém. Diferente da taxa de preenchimento geral (seção 7.3), que usa
  // o período inteiro por definição.
  const missingBusinessDays = teamData.businessDaysInPeriod.filter(
    (d) => d <= today && !filledDates.has(d),
  ).length;
  const lateCount = (ownReports ?? []).filter((r) => r.late).length;

  const resolvedGoal =
    (goalRow as unknown as Record<string, number | null> | null) ??
    (teamData.defaultGoal as unknown as Record<string, number | null> | null);

  const goalIndicators: PacingIndicator[] = GOAL_INDICATORS.map((indicator) => ({
    label: indicator.label,
    realizado: indicator.realizado(totals),
    meta: resolvedGoal ? (resolvedGoal[indicator.key] ?? null) : null,
    format: (v: number) => (indicator.isMoney ? formatBRLCents(v) : String(Math.round(v))),
  }));

  const elapsedEnd = period.end < today ? period.end : today;
  const businessDaysElapsed =
    elapsedEnd < period.start
      ? 0
      : countBusinessDays(period.start, elapsedEnd, teamData.weekdayMask, teamData.holidayDates);

  const teamRatesByStageKey: Record<string, number[]> = {};
  for (const key of Object.keys(STAGE_RATE_FNS)) {
    teamRatesByStageKey[key] = teamData.consultants
      .map((c) => STAGE_RATE_FNS[key](c.totals))
      .filter((v): v is number => v !== null);
  }

  const previous = adjacentPeriod(periodType, period, "prev");
  const { data: previousReports } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("consultant_id", consultantId)
    .gte("report_date", previous.start)
    .lte("report_date", previous.end);
  const previousTotals = aggregateReports((previousReports ?? []).map(toCounts));

  const followupGoal =
    resolvedGoal &&
    resolvedGoal.goal_followup_cold !== null &&
    resolvedGoal.goal_followup_warm !== null &&
    resolvedGoal.goal_followup_hot !== null
      ? resolvedGoal.goal_followup_cold + resolvedGoal.goal_followup_warm + resolvedGoal.goal_followup_hot
      : null;

  const effortReturnActivities: EffortReturnActivity[] = [
    {
      label: "Ligações",
      herVolume: totals.calls_made,
      teamVolumes: teamData.consultants.map((c: ConsultantTeamData) => c.totals.calls_made),
      volumeGoal: resolvedGoal?.goal_calls_made ?? null,
    },
    {
      label: "Follow-ups",
      herVolume: followupTotalDone(totals),
      teamVolumes: teamData.consultants.map((c: ConsultantTeamData) => followupTotalDone(c.totals)),
      volumeGoal: followupGoal,
    },
  ];

  const herConversion = overallConversion(totals);
  const teamConversions = teamData.consultants
    .map((c) => overallConversion(c.totals))
    .filter((v): v is number => v !== null);

  const filledTrailing = (trailingReports ?? []).filter(
    (r) => r.negotiations_open !== null,
  );
  const negotiationsOpenSeries = filledTrailing.map((r) => r.negotiations_open);
  const salesClosedInWindow = filledTrailing.reduce((acc, r) => acc + r.sales_closed, 0);

  return {
    totals,
    previousTotals,
    goalIndicators,
    businessDaysElapsed,
    businessDaysTotal: teamData.businessDaysInPeriod.length,
    teamRatesByStageKey,
    missingBusinessDays,
    lateCount,
    effortReturnActivities,
    herConversion,
    teamConversions,
    negotiationsOpenSeries,
    salesClosedInWindow,
  };
}
