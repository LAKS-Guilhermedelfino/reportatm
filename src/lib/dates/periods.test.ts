import { describe, expect, it } from "vitest";
import {
  adjacentPeriod,
  countBusinessDays,
  dateRangeArray,
  getBiweeklyPeriod,
  getMonthPeriod,
  getPeriod,
  getWeekPeriod,
} from "./periods";

const MON_FRI = 31;

describe("getWeekPeriod (segunda a domingo, ISO 8601)", () => {
  it("uma quinta-feira no meio da semana", () => {
    expect(getWeekPeriod("2026-08-13")).toEqual({
      start: "2026-08-10",
      end: "2026-08-16",
    });
  });

  it("a própria segunda-feira", () => {
    expect(getWeekPeriod("2026-08-10")).toEqual({
      start: "2026-08-10",
      end: "2026-08-16",
    });
  });

  it("o próprio domingo", () => {
    expect(getWeekPeriod("2026-08-16")).toEqual({
      start: "2026-08-10",
      end: "2026-08-16",
    });
  });

  it("semana que cruza a virada de mês", () => {
    // 2026-08-31 é segunda-feira
    expect(getWeekPeriod("2026-09-02")).toEqual({
      start: "2026-08-31",
      end: "2026-09-06",
    });
  });

  it("semana que cruza a virada de ano", () => {
    // 2025-12-29 é segunda-feira
    expect(getWeekPeriod("2026-01-01")).toEqual({
      start: "2025-12-29",
      end: "2026-01-04",
    });
  });
});

describe("getBiweeklyPeriod (1–15 e 16–fim do mês)", () => {
  it("primeira quinzena", () => {
    expect(getBiweeklyPeriod("2026-08-05")).toEqual({
      start: "2026-08-01",
      end: "2026-08-15",
    });
  });

  it("dia 15 exato ainda é primeira quinzena", () => {
    expect(getBiweeklyPeriod("2026-08-15")).toEqual({
      start: "2026-08-01",
      end: "2026-08-15",
    });
  });

  it("segunda quinzena em mês de 31 dias", () => {
    expect(getBiweeklyPeriod("2026-08-20")).toEqual({
      start: "2026-08-16",
      end: "2026-08-31",
    });
  });

  it("segunda quinzena em mês de 30 dias", () => {
    expect(getBiweeklyPeriod("2026-04-20")).toEqual({
      start: "2026-04-16",
      end: "2026-04-30",
    });
  });

  it("segunda quinzena em fevereiro não bissexto", () => {
    expect(getBiweeklyPeriod("2026-02-20")).toEqual({
      start: "2026-02-16",
      end: "2026-02-28",
    });
  });

  it("segunda quinzena em fevereiro bissexto", () => {
    expect(getBiweeklyPeriod("2028-02-20")).toEqual({
      start: "2028-02-16",
      end: "2028-02-29",
    });
  });
});

describe("getMonthPeriod (mês-calendário)", () => {
  it("mês de 31 dias", () => {
    expect(getMonthPeriod("2026-08-13")).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
  });

  it("fevereiro bissexto", () => {
    expect(getMonthPeriod("2028-02-10")).toEqual({
      start: "2028-02-01",
      end: "2028-02-29",
    });
  });

  it("dezembro (virada de ano no fim do período)", () => {
    expect(getMonthPeriod("2026-12-25")).toEqual({
      start: "2026-12-01",
      end: "2026-12-31",
    });
  });
});

describe("getPeriod", () => {
  it("delega pro tipo certo", () => {
    expect(getPeriod("monthly", "2026-08-13")).toEqual({
      start: "2026-08-01",
      end: "2026-08-31",
    });
  });

  it("custom exige start/end explícitos", () => {
    expect(() => getPeriod("custom", "2026-08-13")).toThrow();
    expect(
      getPeriod("custom", "2026-08-13", { start: "2026-01-01", end: "2026-01-10" }),
    ).toEqual({ start: "2026-01-01", end: "2026-01-10" });
  });

  it("daily é só o próprio dia", () => {
    expect(getPeriod("daily", "2026-08-13")).toEqual({
      start: "2026-08-13",
      end: "2026-08-13",
    });
  });
});

describe("dateRangeArray", () => {
  it("inclui start e end", () => {
    expect(dateRangeArray("2026-08-13", "2026-08-15")).toEqual([
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);
  });

  it("um único dia", () => {
    expect(dateRangeArray("2026-08-13", "2026-08-13")).toEqual(["2026-08-13"]);
  });
});

describe("adjacentPeriod", () => {
  it("semana anterior/seguinte", () => {
    const week = getWeekPeriod("2026-08-13");
    expect(adjacentPeriod("weekly", week, "prev")).toEqual({
      start: "2026-08-03",
      end: "2026-08-09",
    });
    expect(adjacentPeriod("weekly", week, "next")).toEqual({
      start: "2026-08-17",
      end: "2026-08-23",
    });
  });

  it("quinzena anterior cruzando o mês", () => {
    const second = getBiweeklyPeriod("2026-08-20"); // 16-31 ago
    expect(adjacentPeriod("biweekly", second, "prev")).toEqual({
      start: "2026-08-01",
      end: "2026-08-15",
    });
  });

  it("mês anterior/seguinte", () => {
    const month = getMonthPeriod("2026-08-13");
    expect(adjacentPeriod("monthly", month, "prev")).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
    });
    expect(adjacentPeriod("monthly", month, "next")).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    });
  });

  it("custom desloca pelo próprio tamanho do período", () => {
    const custom = { start: "2026-08-01", end: "2026-08-10" }; // 10 dias
    expect(adjacentPeriod("custom", custom, "prev")).toEqual({
      start: "2026-07-22",
      end: "2026-07-31",
    });
    expect(adjacentPeriod("custom", custom, "next")).toEqual({
      start: "2026-08-11",
      end: "2026-08-20",
    });
  });
});

describe("countBusinessDays", () => {
  it("uma semana completa seg-sex = 5 dias úteis", () => {
    expect(countBusinessDays("2026-08-10", "2026-08-16", MON_FRI)).toBe(5);
  });

  it("desconta feriado em dia de semana", () => {
    expect(
      countBusinessDays("2026-08-10", "2026-08-16", MON_FRI, ["2026-08-12"]),
    ).toBe(4);
  });

  it("período sem nenhum dia útil (só fim de semana)", () => {
    expect(countBusinessDays("2026-08-15", "2026-08-16", MON_FRI)).toBe(0);
  });
});
