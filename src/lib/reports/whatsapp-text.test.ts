import { describe, expect, it } from "vitest";
import { buildIndividualWhatsAppText, buildTeamWhatsAppText } from "./whatsapp-text";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";
import { formatBRLCents } from "@/lib/format/currency";
import type { IndividualReportData, TeamReportData } from "./types";

const andressaTotals: DailyReportCounts = {
  ...EMPTY_REPORT_COUNTS,
  new_leads_received: 3,
  new_leads_contacted: 3,
  old_leads_contacted: 6,
  old_leads_replied: 2,
  calls_made: 35,
  calls_answered: 5,
  meetings_held: 2,
  quotes_sent: 4,
  negotiations_open: 2,
  sales_closed: 1,
  sales_amount_cents: 187936,
};

describe("buildIndividualWhatsAppText", () => {
  const base: IndividualReportData = {
    companyName: "ATM Seguros",
    consultantName: "Andressa",
    periodLabel: "Semana de 10/08 a 16/08",
    periodStart: "2026-08-10",
    periodEnd: "2026-08-16",
    totals: andressaTotals,
    goal: null,
    fillRate: { filledBusinessDays: 5, totalBusinessDays: 5, rate: 1 },
    findings: [],
  };

  it("mantém o espírito do formato original (seção 1): emoji, CONSULTORA, marcadores", () => {
    const text = buildIndividualWhatsAppText(base, 5, 5);
    expect(text).toContain("📊 RESUMO COMERCIAL");
    expect(text).toContain("CONSULTORA Andressa");
    expect(text).toContain("▫️ Ligações realizadas: 35");
    expect(text).toContain("▫️ Ligações atendidas: 5");
    expect(text).toContain(`▫️ Vendas fechadas: 1 ${formatBRLCents(187936)}`);
  });

  it("não inclui seção de metas quando não há meta nenhuma", () => {
    const text = buildIndividualWhatsAppText(base, 5, 5);
    expect(text).not.toContain("🎯 METAS");
  });

  it("inclui só os indicadores com meta definida", () => {
    const withGoal: IndividualReportData = {
      ...base,
      goal: {
        goal_calls_made: 30,
        goal_followup_cold: null,
        goal_followup_warm: null,
        goal_followup_hot: null,
        goal_meetings_scheduled: null,
        goal_meetings_held: null,
        goal_proposals_submitted: null,
        goal_sales_closed: null,
        goal_sales_amount_cents: null,
      },
    };
    const text = buildIndividualWhatsAppText(withGoal, 5, 5);
    expect(text).toContain("🎯 METAS");
    expect(text).toContain("Ligações realizadas: 35/30");
    expect(text).not.toContain("Vendas fechadas: 1/");
  });

  it("inclui diagnóstico quando há achados", () => {
    const withFindings: IndividualReportData = {
      ...base,
      findings: [
        {
          rule: "falha-de-disciplina",
          title: "Dias sem preenchimento",
          severity: "atencao",
          metric: "2 dias",
          action: "Cobre o preenchimento.",
        },
      ],
    };
    const text = buildIndividualWhatsAppText(withFindings, 5, 5);
    expect(text).toContain("🔍 DIAGNÓSTICO");
    expect(text).toContain("[ATENCAO] Dias sem preenchimento — Cobre o preenchimento.");
  });

  it("não inclui seção de diagnóstico quando não há achados", () => {
    const text = buildIndividualWhatsAppText(base, 5, 5);
    expect(text).not.toContain("🔍 DIAGNÓSTICO");
  });
});

describe("buildTeamWhatsAppText", () => {
  const teamData: TeamReportData = {
    companyName: "ATM Seguros",
    periodLabel: "Mês de agosto",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    teamTotals: { ...EMPTY_REPORT_COUNTS, calls_made: 100, sales_closed: 5, sales_amount_cents: 500000 },
    teamFillRate: { filledBusinessDays: 40, totalBusinessDays: 42, rate: 40 / 42 },
    consultants: [
      { fullName: "Ana", totals: { ...EMPTY_REPORT_COUNTS, calls_made: 60, sales_closed: 3, sales_amount_cents: 300000 } },
      { fullName: "Bia", totals: { ...EMPTY_REPORT_COUNTS, calls_made: 40, sales_closed: 2, sales_amount_cents: 200000 } },
    ],
    aggregatedFindings: [],
    topAttention: [],
  };

  it("formato de time com cabeçalho e nome da empresa", () => {
    const text = buildTeamWhatsAppText(teamData);
    expect(text).toContain("📊 RESUMO COMERCIAL DO TIME");
    expect(text).toContain("ATM Seguros");
    expect(text).toContain("👥 POR CONSULTORA");
    expect(text).toContain("Ana:");
    expect(text).toContain("Bia:");
  });

  it("inclui quem mais precisa de atenção quando presente", () => {
    const withAttention: TeamReportData = {
      ...teamData,
      topAttention: [{ fullName: "Bia", reason: "Meta fora do ritmo" }],
    };
    const text = buildTeamWhatsAppText(withAttention);
    expect(text).toContain("⚠️ QUEM MAIS PRECISA DE ATENÇÃO");
    expect(text).toContain("Bia — Meta fora do ritmo");
  });
});
