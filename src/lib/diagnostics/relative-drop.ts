import { followupTotalDone, type DailyReportCounts } from "@/lib/metrics/rates";
import { formatBRLCents } from "@/lib/format/currency";
import type { Finding } from "./types";

const DROP_THRESHOLD = 0.25; // seção 7.4: mais de 25%

type DropIndicator = {
  label: string;
  current: number;
  previous: number;
  isMoney?: boolean;
};

function format(value: number, isMoney?: boolean): string {
  return isMoney ? formatBRLCents(value) : String(value);
}

/**
 * Regra 3 (seção 7.4): indicador que caiu mais de 25% versus o período
 * anterior equivalente.
 */
export function detectRelativeDrops(
  current: DailyReportCounts,
  previous: DailyReportCounts,
): Finding[] {
  const indicators: DropIndicator[] = [
    { label: "Ligações realizadas", current: current.calls_made, previous: previous.calls_made },
    { label: "Follow-ups feitos", current: followupTotalDone(current), previous: followupTotalDone(previous) },
    { label: "Reuniões realizadas", current: current.meetings_held, previous: previous.meetings_held },
    { label: "Propostas lançadas", current: current.proposals_submitted, previous: previous.proposals_submitted },
    { label: "Vendas fechadas", current: current.sales_closed, previous: previous.sales_closed },
    {
      label: "Valor vendido",
      current: current.sales_amount_cents,
      previous: previous.sales_amount_cents,
      isMoney: true,
    },
  ];

  const findings: Finding[] = [];

  for (const indicator of indicators) {
    if (indicator.previous <= 0) continue; // sem base de comparação — não é queda, é ausência de dado anterior
    const change = (indicator.current - indicator.previous) / indicator.previous;
    if (change >= -DROP_THRESHOLD) continue; // "mais de 25%" — exatamente 25% não conta

    findings.push({
      rule: "queda-relativa",
      title: `Queda em ${indicator.label.toLowerCase()}`,
      severity: change <= -0.5 ? "critico" : "atencao",
      metric: `${format(indicator.current, indicator.isMoney)} vs ${format(indicator.previous, indicator.isMoney)} no período anterior (${Math.round(change * 100)}%)`,
      action: `Investigue por que ${indicator.label.toLowerCase()} caiu ${Math.abs(Math.round(change * 100))}% em relação ao período anterior.`,
    });
  }

  return findings;
}
