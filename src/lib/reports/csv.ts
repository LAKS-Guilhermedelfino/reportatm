import type { DailyReportCounts } from "@/lib/metrics/rates";
import type { TeamConsultantSummary } from "./types";

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: (string | number)[]): string {
  return cells.map((c) => escapeCsvCell(String(c))).join(",");
}

const DAILY_FIELD_ORDER: (keyof DailyReportCounts)[] = [
  "new_leads_received",
  "new_leads_contacted",
  "old_leads_contacted",
  "old_leads_replied",
  "followup_cold_done",
  "followup_cold_replied",
  "followup_warm_done",
  "followup_warm_replied",
  "followup_hot_done",
  "followup_hot_replied",
  "calls_made",
  "calls_answered",
  "meetings_scheduled",
  "meetings_held",
  "quotes_sent",
  "negotiations_open",
  "proposals_submitted",
  "sales_closed",
  "sales_amount_cents",
];

const DAILY_FIELD_LABELS: Record<keyof DailyReportCounts, string> = {
  new_leads_received: "leads_novos_recebidos",
  new_leads_contacted: "contatos_leads_novos",
  old_leads_contacted: "leads_antigos_contatados",
  old_leads_replied: "leads_antigos_responderam",
  followup_cold_done: "followup_frio_feito",
  followup_cold_replied: "followup_frio_respondeu",
  followup_warm_done: "followup_morno_feito",
  followup_warm_replied: "followup_morno_respondeu",
  followup_hot_done: "followup_quente_feito",
  followup_hot_replied: "followup_quente_respondeu",
  calls_made: "ligacoes_realizadas",
  calls_answered: "ligacoes_atendidas",
  meetings_scheduled: "reunioes_agendadas",
  meetings_held: "reunioes_realizadas",
  quotes_sent: "cotacoes_enviadas",
  negotiations_open: "negociacoes_em_andamento",
  proposals_submitted: "propostas_lancadas",
  sales_closed: "vendas_fechadas",
  sales_amount_cents: "valor_vendido_centavos",
};

export type DailyCsvRow = {
  date: string;
  report: DailyReportCounts | null;
  late: boolean;
};

/**
 * CSV diário do relatório individual — uma linha por dia do período. Dia
 * sem report vira célula vazia, não zero (seção 9).
 */
export function buildIndividualCsv(consultantName: string, rows: DailyCsvRow[]): string {
  const header = ["consultora", "data", "preenchido", "atrasado", ...DAILY_FIELD_ORDER.map((f) => DAILY_FIELD_LABELS[f])];
  const lines = [row(header)];

  for (const r of rows) {
    const cells: (string | number)[] = [
      consultantName,
      r.date,
      r.report ? "sim" : "nao",
      r.report ? (r.late ? "sim" : "nao") : "",
    ];
    for (const field of DAILY_FIELD_ORDER) {
      cells.push(r.report ? r.report[field] : "");
    }
    lines.push(row(cells));
  }

  return lines.join("\n");
}

/** CSV do relatório de time — uma linha por consultora com o total do período. */
export function buildTeamCsv(consultants: TeamConsultantSummary[]): string {
  const header = ["consultora", ...DAILY_FIELD_ORDER.map((f) => DAILY_FIELD_LABELS[f])];
  const lines = [row(header)];

  for (const c of consultants) {
    const cells: (string | number)[] = [c.fullName];
    for (const field of DAILY_FIELD_ORDER) {
      cells.push(c.totals[field]);
    }
    lines.push(row(cells));
  }

  return lines.join("\n");
}
