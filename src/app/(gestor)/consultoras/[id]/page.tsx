import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import {
  adjacentPeriod,
  countBusinessDays,
  dateRangeArray,
  getPeriod,
  type Period,
  type PeriodType,
} from "@/lib/dates/periods";
import { computeFillRate } from "@/lib/metrics/period-aggregation";
import { followupTotalDone, type DailyReportCounts } from "@/lib/metrics/rates";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { loadTeamData } from "@/lib/dashboard/team-data";
import { PeriodNav, type PeriodTab } from "@/components/period-nav";
import { EvolutionChart, type DailyPoint } from "@/components/charts/evolution-chart";
import { buttonVariants } from "@/components/ui/button";
import { KpiCards, type ResolvedGoal } from "@/app/(consultora)/meu-desempenho/kpi-cards";
import { Funnel } from "@/app/(consultora)/meu-desempenho/funnel";
import {
  HistoryTableView,
  buildHistoryRows,
  type HistoryReport,
} from "@/app/(consultora)/meu-desempenho/history-table";
import { TeamComparison } from "./team-comparison";
import { loadDiagnosticsInput } from "@/lib/diagnostics/load-diagnostics-input";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";
import { FindingsList } from "@/components/diagnostics/findings-list";

const VALID_TYPES: PeriodType[] = ["weekly", "biweekly", "monthly", "custom"];
const TABS: PeriodTab[] = [
  { type: "weekly", label: "Semana" },
  { type: "biweekly", label: "Quinzena" },
  { type: "monthly", label: "Mês" },
];

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

export default async function ConsultoraDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const today = todaySP();

  const supabase = await createClient();
  const { data: consultant } = await supabase
    .from("profiles")
    .select("id, full_name, email, company_id, started_at, active")
    .eq("id", id)
    .eq("role", "consultora")
    .single();
  if (!consultant) notFound();

  const type: PeriodType = VALID_TYPES.includes(sp.period as PeriodType)
    ? (sp.period as PeriodType)
    : "weekly";
  const referenceDate = sp.date ?? today;
  const custom: Period | undefined =
    type === "custom" && sp.start && sp.end
      ? { start: sp.start, end: sp.end }
      : undefined;
  const period = getPeriod(type, referenceDate, custom ?? { start: today, end: today });

  const [teamData, { data: reports }] = await Promise.all([
    loadTeamData(supabase, consultant.company_id, type, period),
    supabase
      .from("daily_reports")
      .select("*")
      .eq("consultant_id", id)
      .gte("report_date", period.start)
      .lte("report_date", period.end),
  ]);

  const allDays = dateRangeArray(period.start, period.end);
  const reportsByDate = new Map((reports ?? []).map((r) => [r.report_date, r]));
  const totals = (reports ?? [])
    .map(toCounts)
    .reduce<DailyReportCounts>(
      (acc, r) => {
        (Object.keys(acc) as (keyof DailyReportCounts)[]).forEach((k) => {
          acc[k] += r[k];
        });
        return acc;
      },
      {
        new_leads_received: 0, new_leads_contacted: 0, old_leads_contacted: 0, old_leads_replied: 0,
        followup_cold_done: 0, followup_cold_replied: 0, followup_warm_done: 0, followup_warm_replied: 0,
        followup_hot_done: 0, followup_hot_replied: 0, calls_made: 0, calls_answered: 0,
        meetings_scheduled: 0, meetings_held: 0, quotes_sent: 0, negotiations_open: 0,
        proposals_submitted: 0, sales_closed: 0, sales_amount_cents: 0,
      },
    );
  const fillRate = computeFillRate(
    (reports ?? []).map((r) => r.report_date),
    teamData.businessDaysInPeriod,
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

  let resolvedGoal: ResolvedGoal = null;
  if (type !== "custom") {
    const goalColumns = GOAL_INDICATORS.map((i) => i.key).join(",");
    const { data: ownGoal } = await supabase
      .from("goals")
      .select(goalColumns)
      .eq("company_id", consultant.company_id)
      .eq("consultant_id", id)
      .eq("period_type", type)
      .eq("period_start", period.start)
      .eq("period_end", period.end)
      .maybeSingle();
    resolvedGoal = ownGoal
      ? (ownGoal as unknown as ResolvedGoal)
      : teamData.defaultGoal;
  }

  const elapsedEnd = period.end < today ? period.end : today;
  const businessDaysElapsed =
    elapsedEnd < period.start
      ? 0
      : countBusinessDays(period.start, elapsedEnd, teamData.weekdayMask, teamData.holidayDates);

  const prevHref = `/consultoras/${id}?period=${type}&date=${adjacentPeriod(type, period, "prev").start}`;
  const nextHref = `/consultoras/${id}?period=${type}&date=${adjacentPeriod(type, period, "next").start}`;

  const diagnosticsInput = await loadDiagnosticsInput(
    supabase,
    consultant.company_id,
    id,
    type,
    period,
    today,
  );
  const findings = runDiagnostics(diagnosticsInput);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="heading text-2xl text-foreground">
            {consultant.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {consultant.email} · {consultant.active ? "ativa" : "inativa"}
          </p>
        </div>
        <Link
          href={`/consultoras/${id}/editar/${today}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Editar report de hoje
        </Link>
      </header>

      <PeriodNav
        basePath={`/consultoras/${id}`}
        tabs={TABS}
        type={type}
        period={period}
        referenceDate={referenceDate}
        prevHref={prevHref}
        nextHref={nextHref}
        allowCustom
      />

      <KpiCards
        totals={totals}
        fillRate={fillRate}
        goal={resolvedGoal}
        businessDaysElapsed={businessDaysElapsed}
        businessDaysTotal={teamData.businessDaysInPeriod.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Funnel totals={totals} />
        <TeamComparison totals={totals} teamConsultants={teamData.consultants} />
      </div>

      <EvolutionChart data={evolutionData} />

      <FindingsList findings={findings} />

      <HistoryTableView
        rows={historyRows}
        weekdayMask={teamData.weekdayMask}
        holidays={teamData.holidayDates}
      />
    </div>
  );
}
