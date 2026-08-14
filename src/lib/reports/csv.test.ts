import { describe, expect, it } from "vitest";
import { buildIndividualCsv, buildTeamCsv } from "./csv";
import { EMPTY_REPORT_COUNTS, type DailyReportCounts } from "@/lib/metrics/rates";

describe("buildIndividualCsv", () => {
  it("gera cabeçalho e uma linha por dia", () => {
    const csv = buildIndividualCsv("Andressa", [
      { date: "2026-08-10", report: { ...EMPTY_REPORT_COUNTS, calls_made: 35 }, late: false },
      { date: "2026-08-11", report: null, late: false },
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 dias
    expect(lines[0]).toContain("consultora");
    expect(lines[0]).toContain("ligacoes_realizadas");
  });

  it("dia sem report vira célula vazia, não zero", () => {
    const csv = buildIndividualCsv("Andressa", [
      { date: "2026-08-11", report: null, late: false },
    ]);
    const lines = csv.split("\n");
    const cells = lines[1].split(",");
    expect(cells[2]).toBe("nao"); // preenchido = nao
    // os campos numéricos depois de consultora,data,preenchido,atrasado devem estar vazios
    expect(cells.slice(4)).toEqual(cells.slice(4).map(() => ""));
  });

  it("marca atrasado corretamente quando preenchido em atraso", () => {
    const csv = buildIndividualCsv("Andressa", [
      { date: "2026-08-10", report: { ...EMPTY_REPORT_COUNTS }, late: true },
    ]);
    expect(csv.split("\n")[1]).toContain(",sim,sim,");
  });

  it("escapa vírgula no nome da consultora", () => {
    const csv = buildIndividualCsv("Silva, Ana", [
      { date: "2026-08-10", report: { ...EMPTY_REPORT_COUNTS }, late: false },
    ]);
    expect(csv).toContain('"Silva, Ana"');
  });
});

describe("buildTeamCsv", () => {
  it("uma linha por consultora com os totais", () => {
    const csv = buildTeamCsv([
      { fullName: "Ana", totals: { ...EMPTY_REPORT_COUNTS, calls_made: 100 } as DailyReportCounts },
      { fullName: "Bia", totals: { ...EMPTY_REPORT_COUNTS, calls_made: 50 } as DailyReportCounts },
    ]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Ana");
    expect(lines[1]).toContain("100");
  });
});
