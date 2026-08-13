import { describe, expect, it } from "vitest";
import {
  EMPTY_REPORT_COUNTS,
  averageTicketCents,
  callAnswerRate,
  callToMeetingRate,
  followupHotReplyRate,
  followupReplyRate,
  followupTotalDone,
  followupTotalReplied,
  meetingAttendanceRate,
  meetingToProposalRate,
  newLeadsContactRate,
  oldLeadsReplyRate,
  proposalToSaleRate,
  quoteToSaleRate,
  rate,
  type DailyReportCounts,
} from "./rates";

const base: DailyReportCounts = {
  ...EMPTY_REPORT_COUNTS,
  new_leads_received: 3,
  new_leads_contacted: 3,
  old_leads_contacted: 6,
  old_leads_replied: 2,
  followup_cold_done: 5,
  followup_cold_replied: 1,
  followup_warm_done: 8,
  followup_warm_replied: 3,
  followup_hot_done: 4,
  followup_hot_replied: 1,
  calls_made: 35,
  calls_answered: 5,
  meetings_scheduled: 3,
  meetings_held: 2,
  quotes_sent: 4,
  negotiations_open: 2,
  proposals_submitted: 2,
  sales_closed: 1,
  sales_amount_cents: 187936,
};

describe("rate", () => {
  it("retorna null quando o denominador é zero (nunca 0%)", () => {
    expect(rate(5, 0)).toBeNull();
  });

  it("retorna null quando o denominador é negativo (dado corrompido)", () => {
    expect(rate(5, -1)).toBeNull();
  });

  it("calcula a proporção normalmente", () => {
    expect(rate(1, 4)).toBe(0.25);
  });
});

describe("totais de follow-up", () => {
  it("soma as três temperaturas", () => {
    expect(followupTotalDone(base)).toBe(5 + 8 + 4);
    expect(followupTotalReplied(base)).toBe(1 + 3 + 1);
  });

  it("é zero quando o report inteiro está vazio", () => {
    expect(followupTotalDone(EMPTY_REPORT_COUNTS)).toBe(0);
    expect(followupTotalReplied(EMPTY_REPORT_COUNTS)).toBe(0);
  });
});

describe("taxas do funil — relatório da Andressa (seção 1)", () => {
  it("taxa de contato de leads novos", () => {
    expect(newLeadsContactRate(base)).toBe(1);
  });

  it("taxa de resposta de leads antigos", () => {
    expect(oldLeadsReplyRate(base)).toBeCloseTo(2 / 6);
  });

  it("taxa de resposta de follow-up geral", () => {
    expect(followupReplyRate(base)).toBeCloseTo(5 / 17);
  });

  it("taxa de resposta de follow-up quente", () => {
    expect(followupHotReplyRate(base)).toBe(0.25);
  });

  it("taxa de atendimento de ligações", () => {
    expect(callAnswerRate(base)).toBeCloseTo(5 / 35);
  });

  it("ligação → reunião", () => {
    expect(callToMeetingRate(base)).toBeCloseTo(3 / 5);
  });

  it("comparecimento (reuniões realizadas / agendadas)", () => {
    expect(meetingAttendanceRate(base)).toBeCloseTo(2 / 3);
  });

  it("reunião → proposta", () => {
    expect(meetingToProposalRate(base)).toBe(1);
  });

  it("proposta → venda", () => {
    expect(proposalToSaleRate(base)).toBe(0.5);
  });

  it("cotação → venda", () => {
    expect(quoteToSaleRate(base)).toBe(0.25);
  });
});

describe("ticket médio", () => {
  it("é null quando não houve venda (nunca divide por zero)", () => {
    expect(averageTicketCents(EMPTY_REPORT_COUNTS)).toBeNull();
  });

  it("calcula em centavos, sem float impreciso perceptível", () => {
    // R$ 1.879,36 com 1 venda fechada — bate exatamente com o exemplo da seção 1.
    expect(averageTicketCents(base)).toBe(187936);
  });

  it("divide corretamente com mais de uma venda", () => {
    const twoSales: DailyReportCounts = {
      ...base,
      sales_closed: 2,
      sales_amount_cents: 100000,
    };
    expect(averageTicketCents(twoSales)).toBe(50000);
  });
});

describe("todas as taxas do funil são null quando o report está vazio", () => {
  it("nenhuma delas deve retornar 0 — sempre null quando não há dado", () => {
    expect(newLeadsContactRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(oldLeadsReplyRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(followupReplyRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(callAnswerRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(callToMeetingRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(meetingAttendanceRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(meetingToProposalRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(proposalToSaleRate(EMPTY_REPORT_COUNTS)).toBeNull();
    expect(quoteToSaleRate(EMPTY_REPORT_COUNTS)).toBeNull();
  });
});
