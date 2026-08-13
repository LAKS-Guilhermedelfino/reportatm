/**
 * Cálculos puros sobre um único daily_report (seção 7.3). Reaproveitados
 * pelo painel ao vivo do formulário (Fase 3) e pelas agregações por
 * período (Fase 4) — nunca peça pra consultora digitar um valor calculável.
 */

export type DailyReportCounts = {
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
};

export const EMPTY_REPORT_COUNTS: DailyReportCounts = {
  new_leads_received: 0,
  new_leads_contacted: 0,
  old_leads_contacted: 0,
  old_leads_replied: 0,
  followup_cold_done: 0,
  followup_cold_replied: 0,
  followup_warm_done: 0,
  followup_warm_replied: 0,
  followup_hot_done: 0,
  followup_hot_replied: 0,
  calls_made: 0,
  calls_answered: 0,
  meetings_scheduled: 0,
  meetings_held: 0,
  quotes_sent: 0,
  negotiations_open: 0,
  proposals_submitted: 0,
  sales_closed: 0,
  sales_amount_cents: 0,
};

/** null quando o denominador é 0 — nunca exibir "0%" nesse caso (seção 9). */
export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

export function followupTotalDone(r: DailyReportCounts): number {
  return r.followup_cold_done + r.followup_warm_done + r.followup_hot_done;
}

export function followupTotalReplied(r: DailyReportCounts): number {
  return (
    r.followup_cold_replied + r.followup_warm_replied + r.followup_hot_replied
  );
}

export function newLeadsContactRate(r: DailyReportCounts): number | null {
  return rate(r.new_leads_contacted, r.new_leads_received);
}

export function oldLeadsReplyRate(r: DailyReportCounts): number | null {
  return rate(r.old_leads_replied, r.old_leads_contacted);
}

export function followupReplyRate(r: DailyReportCounts): number | null {
  return rate(followupTotalReplied(r), followupTotalDone(r));
}

export function followupColdReplyRate(r: DailyReportCounts): number | null {
  return rate(r.followup_cold_replied, r.followup_cold_done);
}

export function followupWarmReplyRate(r: DailyReportCounts): number | null {
  return rate(r.followup_warm_replied, r.followup_warm_done);
}

export function followupHotReplyRate(r: DailyReportCounts): number | null {
  return rate(r.followup_hot_replied, r.followup_hot_done);
}

export function callAnswerRate(r: DailyReportCounts): number | null {
  return rate(r.calls_answered, r.calls_made);
}

export function callToMeetingRate(r: DailyReportCounts): number | null {
  return rate(r.meetings_scheduled, r.calls_answered);
}

export function meetingAttendanceRate(r: DailyReportCounts): number | null {
  return rate(r.meetings_held, r.meetings_scheduled);
}

export function meetingToProposalRate(r: DailyReportCounts): number | null {
  return rate(r.proposals_submitted, r.meetings_held);
}

export function proposalToSaleRate(r: DailyReportCounts): number | null {
  return rate(r.sales_closed, r.proposals_submitted);
}

export function quoteToSaleRate(r: DailyReportCounts): number | null {
  return rate(r.sales_closed, r.quotes_sent);
}

/** Em centavos. null quando não há venda (nunca dividir por zero). */
export function averageTicketCents(r: DailyReportCounts): number | null {
  if (r.sales_closed <= 0) return null;
  return r.sales_amount_cents / r.sales_closed;
}
