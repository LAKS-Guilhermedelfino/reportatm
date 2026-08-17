import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { dateRangeArray, type Period, type PeriodType } from "@/lib/dates/periods";
import { isBusinessDay } from "@/lib/dates/business-days";
import {
  aggregateReports,
  computeFillRate,
  type FillRate,
} from "@/lib/metrics/period-aggregation";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";
import { GOAL_INDICATORS, type GoalIndicatorKey } from "@/lib/metrics/goal-indicators";

export type ResolvedGoal = Record<GoalIndicatorKey, number | null> | null;

export type ConsultantTeamData = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  totals: DailyReportCounts;
  fillRate: FillRate;
  goal: ResolvedGoal;
};

export type TeamData = {
  consultants: ConsultantTeamData[];
  teamTotals: DailyReportCounts;
  teamFillRate: FillRate;
  defaultGoal: ResolvedGoal;
  weekdayMask: number;
  holidayDates: string[];
  businessDaysInPeriod: string[];
  dailySeries: { date: string; totals: DailyReportCounts | null }[];
};

type DailyReportRow = Database["public"]["Tables"]["daily_reports"]["Row"];

function toCounts(r: DailyReportRow): DailyReportCounts {
  const {
    new_leads_received,
    new_leads_contacted,
    old_leads_contacted,
    old_leads_replied,
    followup_cold_done,
    followup_cold_replied,
    followup_warm_done,
    followup_warm_replied,
    followup_hot_done,
    followup_hot_replied,
    calls_made,
    calls_answered,
    meetings_scheduled,
    meetings_held,
    quotes_sent,
    negotiations_open,
    proposals_submitted,
    sales_closed,
    sales_amount_cents,
  } = r;
  return {
    new_leads_received,
    new_leads_contacted,
    old_leads_contacted,
    old_leads_replied,
    followup_cold_done,
    followup_cold_replied,
    followup_warm_done,
    followup_warm_replied,
    followup_hot_done,
    followup_hot_replied,
    calls_made,
    calls_answered,
    meetings_scheduled,
    meetings_held,
    quotes_sent,
    negotiations_open,
    proposals_submitted,
    sales_closed,
    sales_amount_cents,
  };
}

export async function loadTeamData(
  supabase: SupabaseClient<Database>,
  companyId: string,
  periodType: PeriodType,
  period: Period,
): Promise<TeamData> {
  const [{ data: consultantProfiles }, { data: businessDaysRow }, { data: holidaysRows }, { data: reports }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("company_id", companyId)
        .eq("role", "consultora")
        .eq("active", true)
        .order("full_name"),
      supabase
        .from("business_days")
        .select("weekday_mask")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("holidays")
        .select("date")
        .eq("company_id", companyId)
        .gte("date", period.start)
        .lte("date", period.end),
      supabase
        .from("daily_reports")
        .select("*")
        .eq("company_id", companyId)
        .gte("report_date", period.start)
        .lte("report_date", period.end),
    ]);

  const weekdayMask = businessDaysRow?.weekday_mask ?? 31;
  const holidayDates = (holidaysRows ?? []).map((h) => h.date);
  const allDays = dateRangeArray(period.start, period.end);
  const businessDaysInPeriod = allDays.filter((d) =>
    isBusinessDay(d, weekdayMask, holidayDates),
  );

  const goalsByConsultant = new Map<string, ResolvedGoal>();
  let defaultGoal: ResolvedGoal = null;

  if (periodType !== "custom") {
    const goalColumns = GOAL_INDICATORS.map((i) => i.key).join(",");
    const { data: goalRows } = await supabase
      .from("goals")
      .select(["consultant_id", goalColumns].join(","))
      .eq("company_id", companyId)
      .eq("period_type", periodType)
      .eq("period_start", period.start)
      .eq("period_end", period.end);

    for (const row of goalRows ?? []) {
      const r = row as unknown as { consultant_id: string | null } & Record<
        GoalIndicatorKey,
        number | null
      >;
      const { consultant_id, ...values } = r;
      if (consultant_id === null) {
        defaultGoal = values;
      } else {
        goalsByConsultant.set(consultant_id, values);
      }
    }
  }

  const reportsByConsultant = new Map<string, DailyReportRow[]>();
  for (const r of reports ?? []) {
    const list = reportsByConsultant.get(r.consultant_id) ?? [];
    list.push(r);
    reportsByConsultant.set(r.consultant_id, list);
  }

  const consultants: ConsultantTeamData[] = (consultantProfiles ?? []).map(
    (c) => {
      const ownReports = reportsByConsultant.get(c.id) ?? [];
      const totals = aggregateReports(ownReports.map(toCounts));
      const fillRate = computeFillRate(
        ownReports.map((r) => r.report_date),
        businessDaysInPeriod,
      );
      const goal = goalsByConsultant.get(c.id) ?? defaultGoal;
      return { id: c.id, fullName: c.full_name, avatarUrl: c.avatar_url, totals, fillRate, goal };
    },
  );

  const teamTotals = aggregateReports((reports ?? []).map(toCounts));

  const totalFilledBusinessDays = consultants.reduce(
    (acc, c) => acc + c.fillRate.filledBusinessDays,
    0,
  );
  const totalPossible = businessDaysInPeriod.length * Math.max(1, consultants.length);
  const teamFillRate: FillRate = {
    filledBusinessDays: totalFilledBusinessDays,
    totalBusinessDays: businessDaysInPeriod.length * consultants.length,
    rate:
      businessDaysInPeriod.length > 0 && consultants.length > 0
        ? totalFilledBusinessDays / totalPossible
        : null,
  };

  const reportsByDate = new Map<string, DailyReportRow[]>();
  for (const r of reports ?? []) {
    const list = reportsByDate.get(r.report_date) ?? [];
    list.push(r);
    reportsByDate.set(r.report_date, list);
  }
  const dailySeries = allDays.map((date) => {
    const dayReports = reportsByDate.get(date);
    return {
      date,
      totals: dayReports && dayReports.length > 0
        ? aggregateReports(dayReports.map(toCounts))
        : dayReports
          ? EMPTY_REPORT_COUNTS
          : null,
    };
  });

  return {
    consultants,
    teamTotals,
    teamFillRate,
    defaultGoal,
    weekdayMask,
    holidayDates,
    businessDaysInPeriod,
    dailySeries,
  };
}
