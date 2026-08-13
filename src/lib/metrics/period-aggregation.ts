import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "./rates";

/** Soma vários daily_reports em um único total do período. */
export function aggregateReports(
  reports: readonly DailyReportCounts[],
): DailyReportCounts {
  return reports.reduce<DailyReportCounts>(
    (acc, r) => ({
      new_leads_received: acc.new_leads_received + r.new_leads_received,
      new_leads_contacted: acc.new_leads_contacted + r.new_leads_contacted,
      old_leads_contacted: acc.old_leads_contacted + r.old_leads_contacted,
      old_leads_replied: acc.old_leads_replied + r.old_leads_replied,
      followup_cold_done: acc.followup_cold_done + r.followup_cold_done,
      followup_cold_replied: acc.followup_cold_replied + r.followup_cold_replied,
      followup_warm_done: acc.followup_warm_done + r.followup_warm_done,
      followup_warm_replied: acc.followup_warm_replied + r.followup_warm_replied,
      followup_hot_done: acc.followup_hot_done + r.followup_hot_done,
      followup_hot_replied: acc.followup_hot_replied + r.followup_hot_replied,
      calls_made: acc.calls_made + r.calls_made,
      calls_answered: acc.calls_answered + r.calls_answered,
      meetings_scheduled: acc.meetings_scheduled + r.meetings_scheduled,
      meetings_held: acc.meetings_held + r.meetings_held,
      quotes_sent: acc.quotes_sent + r.quotes_sent,
      negotiations_open: acc.negotiations_open + r.negotiations_open,
      proposals_submitted: acc.proposals_submitted + r.proposals_submitted,
      sales_closed: acc.sales_closed + r.sales_closed,
      sales_amount_cents: acc.sales_amount_cents + r.sales_amount_cents,
    }),
    { ...EMPTY_REPORT_COUNTS },
  );
}

export type FillRate = {
  filledBusinessDays: number;
  totalBusinessDays: number;
  /** null quando o período não tem nenhum dia útil (seção 7.3). */
  rate: number | null;
};

/**
 * dias com report / dias úteis do período (seção 7.3). Só conta, no
 * numerador, dias úteis que têm report — preencher num fim de semana não
 * infla a taxa acima de 100%.
 */
export function computeFillRate(
  filledDates: readonly string[],
  businessDaysInPeriod: readonly string[],
): FillRate {
  const filledSet = new Set(filledDates);
  const filledBusinessDays = businessDaysInPeriod.filter((d) =>
    filledSet.has(d),
  ).length;

  return {
    filledBusinessDays,
    totalBusinessDays: businessDaysInPeriod.length,
    rate:
      businessDaysInPeriod.length > 0
        ? filledBusinessDays / businessDaysInPeriod.length
        : null,
  };
}
