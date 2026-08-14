import { describe, expect, it } from "vitest";
import { runDiagnostics, type DiagnosticsInput } from "./run-diagnostics";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";

function counts(overrides: Partial<DailyReportCounts>): DailyReportCounts {
  return { ...EMPTY_REPORT_COUNTS, ...overrides };
}

function baseInput(overrides: Partial<DiagnosticsInput> = {}): DiagnosticsInput {
  return {
    totals: counts({}),
    previousTotals: counts({}),
    goalIndicators: [],
    businessDaysElapsed: 10,
    businessDaysTotal: 20,
    teamRatesByStageKey: {},
    missingBusinessDays: 0,
    lateCount: 0,
    effortReturnActivities: [],
    herConversion: null,
    teamConversions: [],
    negotiationsOpenSeries: [],
    salesClosedInWindow: 0,
    ...overrides,
  };
}

describe("runDiagnostics", () => {
  it("nenhum achado quando está tudo bem (sem dado suficiente pra nenhuma regra)", () => {
    expect(runDiagnostics(baseInput())).toHaveLength(0);
  });

  it("combina achados de várias regras e ordena por severidade", () => {
    const input = baseInput({
      // Rule 1: fora da meta (crítico)
      goalIndicators: [
        { label: "Ligações", realizado: 10, meta: 100, format: String },
      ],
      // Rule 4: falha de disciplina leve (observação — só 1 atraso)
      lateCount: 1,
      // Rule 7: follow-up desequilibrado (observação, 80%)
      totals: counts({ followup_cold_done: 8, followup_warm_done: 1, followup_hot_done: 1 }),
    });

    const result = runDiagnostics(input);
    expect(result.length).toBeGreaterThan(0);
    // primeiro achado tem que ser o mais severo
    expect(result[0].severity).toBe("critico");
    // ordenado: nenhum item posterior é mais severo que o anterior
    for (let i = 1; i < result.length; i++) {
      const order = { critico: 0, atencao: 1, observacao: 2 };
      expect(order[result[i].severity]).toBeGreaterThanOrEqual(order[result[i - 1].severity]);
    }
  });

  it("nunca devolve mais de 5 achados", () => {
    const input = baseInput({
      goalIndicators: [
        { label: "A", realizado: 1, meta: 100, format: String },
        { label: "B", realizado: 1, meta: 100, format: String },
        { label: "C", realizado: 1, meta: 100, format: String },
        { label: "D", realizado: 1, meta: 100, format: String },
        { label: "E", realizado: 1, meta: 100, format: String },
        { label: "F", realizado: 1, meta: 100, format: String },
      ],
    });
    expect(runDiagnostics(input)).toHaveLength(5);
  });
});
