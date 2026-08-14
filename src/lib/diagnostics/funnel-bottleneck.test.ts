import { describe, expect, it } from "vitest";
import { detectFunnelBottleneck } from "./funnel-bottleneck";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";

const base: DailyReportCounts = {
  ...EMPTY_REPORT_COUNTS,
  calls_made: 100,
  calls_answered: 20, // 20% — bem abaixo da mediana do time
  meetings_scheduled: 10, // 50% de calls_answered
  meetings_held: 8, // 80% de scheduled
  proposals_submitted: 6, // 75% de held
  sales_closed: 3, // 50% de proposals
};

describe("detectFunnelBottleneck", () => {
  it("null quando nenhuma etapa está abaixo da mediana do time", () => {
    const teamRates = {
      call_answer: [0.2, 0.2],
      call_to_meeting: [0.5],
      attendance: [0.8],
      meeting_to_proposal: [0.75],
      proposal_to_sale: [0.5],
    };
    expect(detectFunnelBottleneck(base, teamRates)).toBeNull();
  });

  it("identifica o gargalo e estima o impacto em vendas propagando as taxas dela nas etapas seguintes", () => {
    const teamRates = {
      call_answer: [0.4, 0.4], // mediana 0.4, ela está em 0.2 — gargalo
      call_to_meeting: [0.5],
      attendance: [0.8],
      meeting_to_proposal: [0.75],
      proposal_to_sale: [0.5],
    };
    const finding = detectFunnelBottleneck(base, teamRates);
    expect(finding).not.toBeNull();
    expect(finding!.title).toContain("atendimento de ligação");
    // 100 * 0.4 * 0.5 * 0.8 * 0.75 * 0.5 = 6 vendas hipotéticas vs 3 reais = +3
    expect(finding!.action).toContain("3 venda");
    expect(finding!.severity).toBe("critico");
  });

  it("severidade atenção quando o impacto estimado é pequeno (1 venda)", () => {
    // Gargalo isolado na última etapa (proposta → venda) — sem propagação
    // depois, dá pra controlar o impacto com precisão: 10 * 0.5 - 4 = 1.
    const lastStageBottleneck: DailyReportCounts = {
      ...base,
      calls_answered: 50, // 50%, igual à mediana
      meetings_scheduled: 25, // 50% de calls_answered, igual à mediana
      meetings_held: 20, // 80% de scheduled, igual à mediana
      proposals_submitted: 10, // 50% de held, igual à mediana
      sales_closed: 4, // 40% de proposals — abaixo da mediana de 50%
    };
    const teamRates = {
      call_answer: [0.5],
      call_to_meeting: [0.5],
      attendance: [0.8],
      meeting_to_proposal: [0.5],
      proposal_to_sale: [0.5],
    };
    const finding = detectFunnelBottleneck(lastStageBottleneck, teamRates);
    expect(finding?.severity).toBe("atencao");
    expect(finding?.action).toContain("1 venda");
  });

  it("ignora etapas sem denominador (sem dado suficiente pra taxa)", () => {
    const noCallsMade: DailyReportCounts = { ...EMPTY_REPORT_COUNTS };
    const teamRates = { call_answer: [0.5] };
    expect(detectFunnelBottleneck(noCallsMade, teamRates)).toBeNull();
  });

  it("null quando o time não tem dado suficiente pra calcular mediana em nenhuma etapa", () => {
    expect(detectFunnelBottleneck(base, {})).toBeNull();
  });
});
