import { describe, expect, it } from "vitest";
import {
  formatDateLongPtBR,
  isLateReport,
  isWithinConsultantEditWindow,
  subDaysISO,
} from "./sao-paulo";

describe("subDaysISO", () => {
  it("subtrai dias dentro do mesmo mês", () => {
    expect(subDaysISO("2026-08-13", 2)).toBe("2026-08-11");
  });

  it("cruza a virada de mês", () => {
    expect(subDaysISO("2026-08-01", 2)).toBe("2026-07-30");
  });

  it("cruza a virada de ano", () => {
    expect(subDaysISO("2026-01-01", 1)).toBe("2025-12-31");
  });

  it("respeita ano bissexto em fevereiro", () => {
    expect(subDaysISO("2028-03-01", 1)).toBe("2028-02-29");
  });
});

describe("isWithinConsultantEditWindow (regra 7.2)", () => {
  const today = "2026-08-13";

  it("hoje está sempre editável", () => {
    expect(isWithinConsultantEditWindow(today, today)).toBe(true);
  });

  it("1 e 2 dias atrás estão editáveis (janela de atraso)", () => {
    expect(isWithinConsultantEditWindow("2026-08-12", today)).toBe(true);
    expect(isWithinConsultantEditWindow("2026-08-11", today)).toBe(true);
  });

  it("3 dias atrás já está fora da janela", () => {
    expect(isWithinConsultantEditWindow("2026-08-10", today)).toBe(false);
  });

  it("data futura não é editável", () => {
    expect(isWithinConsultantEditWindow("2026-08-14", today)).toBe(false);
  });

  it("janela cruzando virada de mês", () => {
    expect(isWithinConsultantEditWindow("2026-07-30", "2026-08-01")).toBe(true);
    expect(isWithinConsultantEditWindow("2026-07-29", "2026-08-01")).toBe(false);
  });
});

describe("isLateReport", () => {
  const today = "2026-08-13";

  it("hoje não é atrasado", () => {
    expect(isLateReport(today, today)).toBe(false);
  });

  it("ontem é atrasado", () => {
    expect(isLateReport("2026-08-12", today)).toBe(true);
  });
});

describe("formatDateLongPtBR", () => {
  it("formata por extenso em português", () => {
    expect(formatDateLongPtBR("2026-08-13")).toBe(
      "quinta-feira, 13 de agosto de 2026",
    );
  });
});
