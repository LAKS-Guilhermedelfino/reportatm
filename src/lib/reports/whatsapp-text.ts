import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { goalAttainment } from "@/lib/metrics/goals";
import { GOAL_STATUS_DISPLAY } from "@/lib/metrics/goal-status-display";
import { goalStatus } from "@/lib/metrics/goals";
import type { IndividualReportData, TeamReportData } from "./types";

/**
 * Texto-resumo copiável (seção 8.3): mantém o espírito do formato original
 * do WhatsApp (seção 1) — emoji de cabeçalho, marcadores ▫️ — mas pra um
 * período (não só um dia), com meta e diagnóstico junto.
 */
export function buildIndividualWhatsAppText(
  data: IndividualReportData,
  businessDaysElapsed: number,
  businessDaysTotal: number,
): string {
  const lines: string[] = [];
  lines.push(`📊 RESUMO COMERCIAL — ${data.periodLabel}`);
  lines.push(`CONSULTORA ${data.consultantName}`);
  lines.push(`▫️ Leads novos recebidos: ${data.totals.new_leads_received}`);
  lines.push(`▫️ Contatos com leads novos: ${data.totals.new_leads_contacted}`);
  lines.push(`▫️ Leads antigos contatados: ${data.totals.old_leads_contacted}`);
  lines.push(`▫️ Leads antigos que responderam: ${data.totals.old_leads_replied}`);
  lines.push(
    `▫️ Follow-ups frios: ${data.totals.followup_cold_done} (${data.totals.followup_cold_replied} responderam)`,
  );
  lines.push(
    `▫️ Follow-ups mornos: ${data.totals.followup_warm_done} (${data.totals.followup_warm_replied} responderam)`,
  );
  lines.push(
    `▫️ Follow-ups quentes: ${data.totals.followup_hot_done} (${data.totals.followup_hot_replied} responderam)`,
  );
  lines.push(`▫️ Ligações realizadas: ${data.totals.calls_made}`);
  lines.push(`▫️ Ligações atendidas: ${data.totals.calls_answered}`);
  lines.push(`▫️ Reuniões agendadas: ${data.totals.meetings_scheduled}`);
  lines.push(`▫️ Reuniões realizadas: ${data.totals.meetings_held}`);
  lines.push(`▫️ Cotações enviadas: ${data.totals.quotes_sent}`);
  lines.push(`▫️ Negociação em andamento: ${data.totals.negotiations_open}`);
  lines.push(`▫️ Propostas lançadas no sistema: ${data.totals.proposals_submitted}`);
  lines.push(
    `▫️ Vendas fechadas: ${data.totals.sales_closed} ${formatBRLCents(data.totals.sales_amount_cents)}`,
  );
  lines.push(`▫️ Taxa de preenchimento: ${formatPercent(data.fillRate.rate)}`);

  const goalLines = GOAL_INDICATORS.filter(
    (indicator) => data.goal && data.goal[indicator.key] !== null,
  ).map((indicator) => {
    const realizado = indicator.realizado(data.totals);
    const meta = data.goal![indicator.key] as number;
    const attainment = goalAttainment(realizado, meta);
    const status = goalStatus(realizado, meta, businessDaysElapsed, businessDaysTotal);
    const statusLabel = GOAL_STATUS_DISPLAY[status].label;
    const realizadoFmt = indicator.isMoney ? formatBRLCents(realizado) : realizado;
    const metaFmt = indicator.isMoney ? formatBRLCents(meta) : meta;
    return `▫️ ${indicator.label}: ${realizadoFmt}/${metaFmt} (${formatPercent(attainment)} — ${statusLabel})`;
  });

  if (goalLines.length > 0) {
    lines.push("");
    lines.push("🎯 METAS");
    lines.push(...goalLines);
  }

  if (data.findings.length > 0) {
    lines.push("");
    lines.push("🔍 DIAGNÓSTICO");
    for (const finding of data.findings) {
      lines.push(`▫️ [${finding.severity.toUpperCase()}] ${finding.title} — ${finding.action}`);
    }
  }

  return lines.join("\n");
}

export function buildTeamWhatsAppText(data: TeamReportData): string {
  const lines: string[] = [];
  lines.push(`📊 RESUMO COMERCIAL DO TIME — ${data.periodLabel}`);
  lines.push(data.companyName);
  lines.push(`▫️ Ligações realizadas: ${data.teamTotals.calls_made}`);
  lines.push(`▫️ Reuniões realizadas: ${data.teamTotals.meetings_held}`);
  lines.push(`▫️ Propostas lançadas: ${data.teamTotals.proposals_submitted}`);
  lines.push(
    `▫️ Vendas fechadas: ${data.teamTotals.sales_closed} ${formatBRLCents(data.teamTotals.sales_amount_cents)}`,
  );
  lines.push(`▫️ Taxa de preenchimento do time: ${formatPercent(data.teamFillRate.rate)}`);

  lines.push("");
  lines.push("👥 POR CONSULTORA");
  for (const c of data.consultants) {
    lines.push(
      `▫️ ${c.fullName}: ${c.totals.calls_made} ligações · ${c.totals.sales_closed} venda(s) ${formatBRLCents(c.totals.sales_amount_cents)}`,
    );
  }

  if (data.aggregatedFindings.length > 0) {
    lines.push("");
    lines.push("🔍 DIAGNÓSTICO DO TIME");
    for (const finding of data.aggregatedFindings) {
      lines.push(`▫️ [${finding.severity.toUpperCase()}] ${finding.title} — ${finding.action}`);
    }
  }

  if (data.topAttention.length > 0) {
    lines.push("");
    lines.push("⚠️ QUEM MAIS PRECISA DE ATENÇÃO");
    for (const t of data.topAttention) {
      lines.push(`▫️ ${t.fullName} — ${t.reason}`);
    }
  }

  return lines.join("\n");
}
