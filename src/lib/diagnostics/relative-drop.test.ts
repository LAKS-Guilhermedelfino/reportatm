import { describe, expect, it } from "vitest";
import { detectRelativeDrops } from "./relative-drop";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";
import { formatBRLCents } from "@/lib/format/currency";

function counts(overrides: Partial<DailyReportCounts>): DailyReportCounts {
  return { ...EMPTY_REPORT_COUNTS, ...overrides };
}

describe("detectRelativeDrops", () => {
  it("nenhum achado quando não há período anterior (tudo zero)", () => {
    const current = counts({ calls_made: 10 });
    const previous = counts({});
    expect(detectRelativeDrops(current, previous)).toHaveLength(0);
  });

  it("nenhum achado quando a queda é de exatamente 25% (só dispara acima)", () => {
    const current = counts({ calls_made: 75 });
    const previous = counts({ calls_made: 100 });
    expect(detectRelativeDrops(current, previous)).toHaveLength(0);
  });

  it("nenhum achado quando a queda é menor que 25%", () => {
    const current = counts({ calls_made: 80 });
    const previous = counts({ calls_made: 100 });
    expect(detectRelativeDrops(current, previous)).toHaveLength(0);
  });

  it("gera achado de atenção quando cai mais de 25%", () => {
    const current = counts({ calls_made: 60 }); // -40%
    const previous = counts({ calls_made: 100 });
    const result = detectRelativeDrops(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("atencao");
    expect(result[0].metric).toContain("-40%");
  });

  it("gera achado crítico quando cai 50% ou mais", () => {
    const current = counts({ sales_closed: 2 });
    const previous = counts({ sales_closed: 5 }); // -60%
    const result = detectRelativeDrops(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("critico");
  });

  it("formata valor vendido em BRL", () => {
    const current = counts({ sales_amount_cents: 50000 });
    const previous = counts({ sales_amount_cents: 200000 }); // -75%
    const result = detectRelativeDrops(current, previous);
    expect(result[0].metric).toContain(formatBRLCents(50000));
    expect(result[0].metric).toContain(formatBRLCents(200000));
  });

  it("detecta queda em follow-ups totais (soma das 3 temperaturas)", () => {
    const current = counts({ followup_cold_done: 2, followup_warm_done: 1, followup_hot_done: 0 });
    const previous = counts({ followup_cold_done: 10, followup_warm_done: 5, followup_hot_done: 5 }); // 3 vs 20 = -85%
    const result = detectRelativeDrops(current, previous);
    expect(result.some((f) => f.title.includes("follow-ups"))).toBe(true);
  });

  it("um aumento não gera achado", () => {
    const current = counts({ calls_made: 200 });
    const previous = counts({ calls_made: 100 });
    expect(detectRelativeDrops(current, previous)).toHaveLength(0);
  });
});
