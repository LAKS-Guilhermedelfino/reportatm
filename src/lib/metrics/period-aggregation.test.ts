import { describe, expect, it } from "vitest";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "./rates";
import { aggregateReports, computeFillRate } from "./period-aggregation";

describe("aggregateReports", () => {
  it("soma zero relatórios como tudo zerado", () => {
    expect(aggregateReports([])).toEqual(EMPTY_REPORT_COUNTS);
  });

  it("soma campo a campo, sem misturar", () => {
    const a: DailyReportCounts = {
      ...EMPTY_REPORT_COUNTS,
      calls_made: 35,
      sales_closed: 1,
      sales_amount_cents: 187936,
    };
    const b: DailyReportCounts = {
      ...EMPTY_REPORT_COUNTS,
      calls_made: 10,
      sales_closed: 2,
      sales_amount_cents: 50000,
    };
    const total = aggregateReports([a, b]);
    expect(total.calls_made).toBe(45);
    expect(total.sales_closed).toBe(3);
    expect(total.sales_amount_cents).toBe(237936);
    expect(total.new_leads_received).toBe(0);
  });
});

describe("computeFillRate", () => {
  it("null quando não há dia útil no período", () => {
    expect(computeFillRate([], [])).toEqual({
      filledBusinessDays: 0,
      totalBusinessDays: 0,
      rate: null,
    });
  });

  it("100% quando preencheu todos os dias úteis", () => {
    const businessDays = ["2026-08-10", "2026-08-11", "2026-08-12"];
    expect(computeFillRate(businessDays, businessDays)).toEqual({
      filledBusinessDays: 3,
      totalBusinessDays: 3,
      rate: 1,
    });
  });

  it("parcial quando faltou algum dia útil", () => {
    const businessDays = ["2026-08-10", "2026-08-11", "2026-08-12"];
    const filled = ["2026-08-10", "2026-08-12"];
    const result = computeFillRate(filled, businessDays);
    expect(result.filledBusinessDays).toBe(2);
    expect(result.totalBusinessDays).toBe(3);
    expect(result.rate).toBeCloseTo(2 / 3);
  });

  it("preencher num fim de semana não conta a mais nem estoura 100%", () => {
    const businessDays = ["2026-08-10", "2026-08-11"];
    const filled = ["2026-08-10", "2026-08-11", "2026-08-15"]; // sábado extra
    const result = computeFillRate(filled, businessDays);
    expect(result.rate).toBe(1);
  });
});
