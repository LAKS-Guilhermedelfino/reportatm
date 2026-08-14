import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { type Period, type PeriodType } from "@/lib/dates/periods";
import { computeFillRate } from "@/lib/metrics/period-aggregation";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { loadTeamData, type ResolvedGoal } from "@/lib/dashboard/team-data";
import { loadDiagnosticsInput } from "@/lib/diagnostics/load-diagnostics-input";
import { runDiagnostics } from "@/lib/diagnostics/run-diagnostics";
import { SEVERITY_ORDER, limitFindings, type Finding } from "@/lib/diagnostics/types";
import { dateRangeArray } from "@/lib/dates/periods";
import type { IndividualReportData, TeamReportData } from "./types";
import type { DailyCsvRow } from "./csv";

const PERIOD_TYPE_LABEL: Record<PeriodType, string> = {
  daily: "Dia",
  weekly: "Semana",
  biweekly: "Quinzena",
  monthly: "Mês",
  custom: "Período",
};

function shortDate(dateISO: string): string {
  const [, m, d] = dateISO.split("-");
  return `${d}/${m}`;
}

export function buildPeriodLabel(type: PeriodType, period: Period): string {
  return `${PERIOD_TYPE_LABEL[type]} de ${shortDate(period.start)} a ${shortDate(period.end)}`;
}

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

function sumCounts(rows: DailyReportCounts[]): DailyReportCounts {
  return rows.reduce<DailyReportCounts>((acc, r) => {
    (Object.keys(acc) as (keyof DailyReportCounts)[]).forEach((k) => {
      acc[k] += r[k];
    });
    return acc;
  }, { ...EMPTY_REPORT_COUNTS });
}

/**
 * Monta os dados do relatório individual (seção 8.3 /relatorios) — reaproveita
 * `loadTeamData` só pra dias úteis e meta padrão; totais/meta/preenchimento da
 * própria consultora são buscados à parte pra funcionar mesmo se ela estiver
 * inativa (loadTeamData só lista consultoras ativas).
 */
export async function loadIndividualReportData(
  supabase: SupabaseClient<Database>,
  companyId: string,
  companyName: string,
  consultantId: string,
  consultantName: string,
  type: PeriodType,
  period: Period,
  today: string,
): Promise<IndividualReportData> {
  const [teamData, { data: reports }] = await Promise.all([
    loadTeamData(supabase, companyId, type, period),
    supabase
      .from("daily_reports")
      .select("*")
      .eq("consultant_id", consultantId)
      .gte("report_date", period.start)
      .lte("report_date", period.end),
  ]);

  const totals = sumCounts((reports ?? []).map(toCounts));
  const fillRate = computeFillRate(
    (reports ?? []).map((r) => r.report_date),
    teamData.businessDaysInPeriod,
  );

  let goal: ResolvedGoal = null;
  if (type !== "custom") {
    const goalColumns = GOAL_INDICATORS.map((i) => i.key).join(",");
    const { data: ownGoal } = await supabase
      .from("goals")
      .select(goalColumns)
      .eq("company_id", companyId)
      .eq("consultant_id", consultantId)
      .eq("period_type", type)
      .eq("period_start", period.start)
      .eq("period_end", period.end)
      .maybeSingle();
    goal = ownGoal ? (ownGoal as unknown as ResolvedGoal) : teamData.defaultGoal;
  }

  const diagnosticsInput = await loadDiagnosticsInput(
    supabase,
    companyId,
    consultantId,
    type,
    period,
    today,
  );
  const findings = runDiagnostics(diagnosticsInput);

  return {
    companyName,
    consultantName,
    periodLabel: buildPeriodLabel(type, period),
    periodStart: period.start,
    periodEnd: period.end,
    totals,
    goal,
    fillRate,
    findings,
  };
}

/** Uma linha por dia do período, pro CSV individual (dia sem report = null). */
export async function loadIndividualDailyRows(
  supabase: SupabaseClient<Database>,
  consultantId: string,
  period: Period,
): Promise<DailyCsvRow[]> {
  const { data: reports } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("consultant_id", consultantId)
    .gte("report_date", period.start)
    .lte("report_date", period.end);

  const byDate = new Map((reports ?? []).map((r) => [r.report_date, r]));
  return dateRangeArray(period.start, period.end).map((date) => {
    const r = byDate.get(date);
    return { date, report: r ? toCounts(r) : null, late: r?.late ?? false };
  });
}

/** Monta os dados do relatório de time (seção 8.3 /relatorios). */
export async function loadTeamReportData(
  supabase: SupabaseClient<Database>,
  companyId: string,
  companyName: string,
  type: PeriodType,
  period: Period,
  today: string,
): Promise<TeamReportData> {
  const teamData = await loadTeamData(supabase, companyId, type, period);

  const perConsultant = await Promise.all(
    teamData.consultants.map(async (c) => {
      const input = await loadDiagnosticsInput(supabase, companyId, c.id, type, period, today);
      return { id: c.id, fullName: c.fullName, findings: runDiagnostics(input) };
    }),
  );

  const aggregatedFindings = limitFindings(perConsultant.flatMap((c) => c.findings));

  const attentionScore = (findings: Finding[]) => {
    const criticos = findings.filter((f) => f.severity === "critico").length;
    const atencoes = findings.filter((f) => f.severity === "atencao").length;
    return criticos * 100 + atencoes * 10 + findings.length;
  };
  const topAttention = [...perConsultant]
    .filter((c) => c.findings.length > 0)
    .sort((a, b) => attentionScore(b.findings) - attentionScore(a.findings))
    .slice(0, 3)
    .map((c) => {
      const top = [...c.findings].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      )[0];
      return { fullName: c.fullName, reason: top.title };
    });

  return {
    companyName,
    periodLabel: buildPeriodLabel(type, period),
    periodStart: period.start,
    periodEnd: period.end,
    teamTotals: teamData.teamTotals,
    teamFillRate: teamData.teamFillRate,
    consultants: teamData.consultants.map((c) => ({ fullName: c.fullName, totals: c.totals })),
    aggregatedFindings,
    topAttention,
  };
}
