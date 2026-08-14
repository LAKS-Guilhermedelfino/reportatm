import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import {
  adjacentPeriod,
  countBusinessDays,
  getPeriod,
  type Period,
  type PeriodType,
} from "@/lib/dates/periods";
import { PeriodNav, type PeriodTab } from "@/components/period-nav";
import { EvolutionChart, type DailyPoint } from "@/components/charts/evolution-chart";
import { loadTeamData } from "@/lib/dashboard/team-data";
import { followupTotalDone } from "@/lib/metrics/rates";
import { TeamKpis } from "./team-kpis";
import { Matrix } from "./matrix";
import { TeamFunnel } from "./team-funnel";
import { Ranking, VALID_RANK_KEYS, type RankKey } from "./ranking";
import { FillAlert } from "./fill-alert";
import { TeamDiagnostics, type ConsultantFindings } from "./team-diagnostics";
import { loadDiagnosticsInput } from "@/lib/diagnostics/load-diagnostics-input";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";

const VALID_TYPES: PeriodType[] = ["daily", "weekly", "biweekly", "monthly", "custom"];
const TABS: PeriodTab[] = [
  { type: "daily", label: "Dia" },
  { type: "weekly", label: "Semana" },
  { type: "biweekly", label: "Quinzena" },
  { type: "monthly", label: "Mês" },
];

export default async function DashboardPage({
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
  const rank: RankKey = VALID_RANK_KEYS.includes(sp.rank as RankKey)
    ? (sp.rank as RankKey)
    : "sales_closed";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id ?? "";

  const teamData = await loadTeamData(supabase, companyId, type, period);

  const showToday = today >= period.start && today <= period.end;
  let todayFilledIds = new Set<string>();
  if (showToday) {
    const { data: todayReports } = await supabase
      .from("daily_reports")
      .select("consultant_id")
      .eq("company_id", companyId)
      .eq("report_date", today);
    todayFilledIds = new Set((todayReports ?? []).map((r) => r.consultant_id));
  }

  const elapsedEnd = period.end < today ? period.end : today;
  const businessDaysElapsed =
    elapsedEnd < period.start
      ? 0
      : countBusinessDays(period.start, elapsedEnd, teamData.weekdayMask, teamData.holidayDates);

  const evolutionData: DailyPoint[] = teamData.dailySeries.map(({ date, totals }) => {
    const [, m, d] = date.split("-");
    return {
      date,
      dateLabel: `${d}/${m}`,
      calls_made: totals ? totals.calls_made : null,
      meetings_held: totals ? totals.meetings_held : null,
      followup_total: totals ? followupTotalDone(totals) : null,
      sales_closed: totals ? totals.sales_closed : null,
    };
  });

  const perConsultantFindings: ConsultantFindings[] = await Promise.all(
    teamData.consultants.map(async (c) => {
      const input = await loadDiagnosticsInput(supabase, companyId, c.id, type, period, today);
      return { id: c.id, fullName: c.fullName, findings: runDiagnostics(input) };
    }),
  );

  const prevHref = `/dashboard?period=${type}&date=${adjacentPeriod(type, period, "prev").start}`;
  const nextHref = `/dashboard?period=${type}&date=${adjacentPeriod(type, period, "next").start}`;
  const baseQuery = `period=${type}&date=${referenceDate}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão do time (seção 8.3).</p>
      </header>

      <PeriodNav
        basePath="/dashboard"
        tabs={TABS}
        type={type}
        period={period}
        referenceDate={referenceDate}
        prevHref={prevHref}
        nextHref={nextHref}
        allowCustom
      />

      <FillAlert
        consultants={teamData.consultants}
        todayFilledIds={todayFilledIds}
        showToday={showToday}
      />

      <TeamKpis totals={teamData.teamTotals} fillRate={teamData.teamFillRate} />

      <Matrix
        consultants={teamData.consultants}
        businessDaysElapsed={businessDaysElapsed}
        businessDaysTotal={teamData.businessDaysInPeriod.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TeamFunnel consultants={teamData.consultants} />
        <Ranking consultants={teamData.consultants} selected={rank} baseQuery={baseQuery} />
      </div>

      <EvolutionChart data={evolutionData} />

      <TeamDiagnostics perConsultant={perConsultantFindings} />
    </div>
  );
}
