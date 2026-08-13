import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import {
  adjacentPeriod,
  dateRangeArray,
  getPeriod,
  type Period,
  type PeriodType,
} from "@/lib/dates/periods";
import { isBusinessDay } from "@/lib/dates/business-days";
import {
  aggregateReports,
  computeFillRate,
} from "@/lib/metrics/period-aggregation";
import { followupTotalDone, type DailyReportCounts } from "@/lib/metrics/rates";
import { PeriodSelector } from "./period-selector";
import { KpiCards } from "./kpi-cards";
import { Funnel } from "./funnel";
import { EvolutionChart, type DailyPoint } from "./evolution-chart";
import { HistoryTableView, buildHistoryRows, type HistoryReport } from "./history-table";

const VALID_TYPES: PeriodType[] = ["weekly", "biweekly", "monthly", "custom"];

function toCounts(r: {
  new_leads_received: number;
  new_leads_contacted: number;
  old_leads_contacted: number;
  old_leads_replied: number;
  followup_cold_done: number;
  followup_cold_replied: number;
  followup_warm_done: number;
  followup_warm_replied: number;
  followup_hot_done: number;
  followup_hot_replied: number;
  calls_made: number;
  calls_answered: number;
  meetings_scheduled: number;
  meetings_held: number;
  quotes_sent: number;
  negotiations_open: number;
  proposals_submitted: number;
  sales_closed: number;
  sales_amount_cents: number;
}): DailyReportCounts {
  return { ...r };
}

export default async function MeuDesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const today = todaySP();

  const type: PeriodType = VALID_TYPES.includes(sp.period as PeriodType)
    ? (sp.period as PeriodType)
    : "weekly";
  const referenceDate = sp.date ?? today;
  const custom: Period | undefined =
    type === "custom" && sp.start && sp.end
      ? { start: sp.start, end: sp.end }
      : undefined;

  const period = getPeriod(type, referenceDate, custom ?? { start: today, end: today });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id")
    .eq("id", user.id)
    .single();

  const [{ data: reports }, { data: businessDaysRow }, { data: holidaysRows }] =
    await Promise.all([
      supabase
        .from("daily_reports")
        .select("*")
        .eq("consultant_id", user.id)
        .gte("report_date", period.start)
        .lte("report_date", period.end),
      supabase
        .from("business_days")
        .select("weekday_mask")
        .eq("company_id", profile?.company_id ?? "")
        .maybeSingle(),
      supabase
        .from("holidays")
        .select("date")
        .eq("company_id", profile?.company_id ?? "")
        .gte("date", period.start)
        .lte("date", period.end),
    ]);

  const weekdayMask = businessDaysRow?.weekday_mask ?? 31;
  const holidayDates = (holidaysRows ?? []).map((h) => h.date);
  const allDays = dateRangeArray(period.start, period.end);
  const businessDaysInPeriod = allDays.filter((d) =>
    isBusinessDay(d, weekdayMask, holidayDates),
  );

  const reportsByDate = new Map((reports ?? []).map((r) => [r.report_date, r]));
  const totals = aggregateReports((reports ?? []).map(toCounts));
  const fillRate = computeFillRate(
    (reports ?? []).map((r) => r.report_date),
    businessDaysInPeriod,
  );

  const evolutionData: DailyPoint[] = allDays.map((date) => {
    const r = reportsByDate.get(date);
    const [, m, d] = date.split("-");
    return {
      date,
      dateLabel: `${d}/${m}`,
      calls_made: r ? r.calls_made : null,
      meetings_held: r ? r.meetings_held : null,
      followup_total: r ? followupTotalDone(toCounts(r)) : null,
      sales_closed: r ? r.sales_closed : null,
    };
  });

  const historyReportsByDate = new Map<string, HistoryReport>(
    (reports ?? []).map((r) => [
      r.report_date,
      {
        calls_made: r.calls_made,
        sales_closed: r.sales_closed,
        sales_amount_cents: r.sales_amount_cents,
        late: r.late,
      },
    ]),
  );
  const historyRows = buildHistoryRows([...allDays].reverse(), historyReportsByDate);

  const prevHref = `/meu-desempenho?period=${type}&date=${adjacentPeriod(type, period, "prev").start}`;
  const nextHref = `/meu-desempenho?period=${type}&date=${adjacentPeriod(type, period, "next").start}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Meu desempenho</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.full_name}
        </p>
      </header>

      <PeriodSelector
        type={type}
        period={period}
        referenceDate={referenceDate}
        prevHref={prevHref}
        nextHref={nextHref}
      />

      <KpiCards totals={totals} fillRate={fillRate} />

      <EvolutionChart data={evolutionData} />

      <Funnel totals={totals} />

      <HistoryTableView
        rows={historyRows}
        weekdayMask={weekdayMask}
        holidays={holidayDates}
      />
    </div>
  );
}
