import type { DailyReportCounts } from "./rates";

export type GoalIndicatorKey =
  | "goal_followup_cold"
  | "goal_followup_warm"
  | "goal_followup_hot"
  | "goal_calls_made"
  | "goal_meetings_scheduled"
  | "goal_meetings_held"
  | "goal_proposals_submitted"
  | "goal_sales_closed"
  | "goal_sales_amount_cents";

export type GoalIndicator = {
  key: GoalIndicatorKey;
  label: string;
  realizado: (totals: DailyReportCounts) => number;
  isMoney?: boolean;
};

/** As 9 metas da seção 6/8.3 — mesma ordem em toda a UI. */
export const GOAL_INDICATORS: GoalIndicator[] = [
  {
    key: "goal_followup_cold",
    label: "Follow-up frio",
    realizado: (t) => t.followup_cold_done,
  },
  {
    key: "goal_followup_warm",
    label: "Follow-up morno",
    realizado: (t) => t.followup_warm_done,
  },
  {
    key: "goal_followup_hot",
    label: "Follow-up quente",
    realizado: (t) => t.followup_hot_done,
  },
  {
    key: "goal_calls_made",
    label: "Ligações realizadas",
    realizado: (t) => t.calls_made,
  },
  {
    key: "goal_meetings_scheduled",
    label: "Reuniões agendadas",
    realizado: (t) => t.meetings_scheduled,
  },
  {
    key: "goal_meetings_held",
    label: "Reuniões realizadas",
    realizado: (t) => t.meetings_held,
  },
  {
    key: "goal_proposals_submitted",
    label: "Propostas lançadas",
    realizado: (t) => t.proposals_submitted,
  },
  {
    key: "goal_sales_closed",
    label: "Vendas fechadas",
    realizado: (t) => t.sales_closed,
  },
  {
    key: "goal_sales_amount_cents",
    label: "Valor vendido",
    realizado: (t) => t.sales_amount_cents,
    isMoney: true,
  },
];
