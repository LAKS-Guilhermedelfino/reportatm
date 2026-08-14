import type { DailyReportCounts } from "@/lib/metrics/rates";
import { formatPercent } from "@/lib/format/currency";
import { median, type Finding } from "./types";

type FunnelStageDef = {
  key: string;
  label: string;
  denominator: (t: DailyReportCounts) => number;
  numerator: (t: DailyReportCounts) => number;
};

const STAGES: FunnelStageDef[] = [
  {
    key: "call_answer",
    label: "atendimento de ligação",
    denominator: (t) => t.calls_made,
    numerator: (t) => t.calls_answered,
  },
  {
    key: "call_to_meeting",
    label: "ligação → reunião",
    denominator: (t) => t.calls_answered,
    numerator: (t) => t.meetings_scheduled,
  },
  {
    key: "attendance",
    label: "comparecimento",
    denominator: (t) => t.meetings_scheduled,
    numerator: (t) => t.meetings_held,
  },
  {
    key: "meeting_to_proposal",
    label: "reunião → proposta",
    denominator: (t) => t.meetings_held,
    numerator: (t) => t.proposals_submitted,
  },
  {
    key: "proposal_to_sale",
    label: "proposta → venda",
    denominator: (t) => t.proposals_submitted,
    numerator: (t) => t.sales_closed,
  },
];

function stageRate(stage: FunnelStageDef, totals: DailyReportCounts): number | null {
  const den = stage.denominator(totals);
  return den > 0 ? stage.numerator(totals) / den : null;
}

/** Refaz o funil a partir do estágio `fromIndex` com uma taxa hipotética,
 * propagando as taxas DELA nos estágios seguintes, até chegar em vendas. */
function simulateSalesWithStageRate(
  totals: DailyReportCounts,
  fromIndex: number,
  hypotheticalRate: number,
): number {
  let currentCount = STAGES[fromIndex].denominator(totals) * hypotheticalRate;
  for (let j = fromIndex + 1; j < STAGES.length; j++) {
    const herRate = stageRate(STAGES[j], totals);
    currentCount = herRate !== null ? currentCount * herRate : 0;
  }
  return currentCount;
}

/**
 * Regra 2 (seção 7.4): a etapa do funil mais abaixo da mediana do time,
 * com o impacto estimado em vendas se ela chegasse na mediana.
 */
export function detectFunnelBottleneck(
  totals: DailyReportCounts,
  teamRatesByStageKey: Record<string, number[]>,
): Finding | null {
  let worst: { index: number; deficit: number; herRate: number; teamMedian: number } | null = null;

  STAGES.forEach((stage, index) => {
    const herRate = stageRate(stage, totals);
    if (herRate === null) return;
    const teamMedianRate = median(teamRatesByStageKey[stage.key] ?? []);
    if (teamMedianRate === null) return;
    const deficit = teamMedianRate - herRate;
    if (deficit > 0 && (worst === null || deficit > worst.deficit)) {
      worst = { index, deficit, herRate, teamMedian: teamMedianRate };
    }
  });

  if (worst === null) return null;

  const w: { index: number; deficit: number; herRate: number; teamMedian: number } = worst;
  const stage = STAGES[w.index];
  const hypotheticalSales = simulateSalesWithStageRate(totals, w.index, w.teamMedian);
  const impact = Math.round(hypotheticalSales - totals.sales_closed);

  if (impact <= 0) return null;

  return {
    rule: "gargalo-do-funil",
    title: `Gargalo no funil: ${stage.label}`,
    severity: impact >= 2 ? "critico" : "atencao",
    metric: `${formatPercent(w.herRate)} vs mediana do time ${formatPercent(w.teamMedian)}`,
    action: `Se chegasse na mediana do time em "${stage.label}", teria fechado ~${impact} venda(s) a mais no período.`,
  };
}
