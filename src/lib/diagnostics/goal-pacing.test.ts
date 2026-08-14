import { describe, expect, it } from "vitest";
import { detectGoalPacingFindings, type PacingIndicator } from "./goal-pacing";

const fmt = (v: number) => String(Math.round(v * 10) / 10);

function indicator(label: string, realizado: number, meta: number | null): PacingIndicator {
  return { label, realizado, meta, format: fmt };
}

describe("detectGoalPacingFindings", () => {
  it("nenhum achado quando não há meta", () => {
    const result = detectGoalPacingFindings(
      [indicator("Ligações", 10, null)],
      5,
      20,
    );
    expect(result).toHaveLength(0);
  });

  it("nenhum achado quando está atingido ou no ritmo", () => {
    // ritmo esperado = 100*(5/20) = 25; realizado 25 = 100% do ritmo -> no-ritmo
    const result = detectGoalPacingFindings(
      [indicator("Ligações", 25, 100)],
      5,
      20,
    );
    expect(result).toHaveLength(0);
  });

  it("gera achado crítico quando fora da meta, com gap por dia útil restante", () => {
    // ritmo esperado = 100*(5/20)=25, realizado 10 = 40% do ritmo -> fora-da-meta
    const result = detectGoalPacingFindings(
      [indicator("Ligações", 10, 100)],
      5,
      20,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("critico");
    // gap = 100-10=90, dias restantes = 20-5=15, 90/15=6
    expect(result[0].action).toContain("6");
  });

  it("gera achado de atenção quando em risco", () => {
    // ritmo esperado = 25, realizado 22 = 88% do ritmo -> em-risco
    const result = detectGoalPacingFindings(
      [indicator("Ligações", 22, 100)],
      5,
      20,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("atencao");
  });

  it("lida com período sem dias úteis restantes", () => {
    const result = detectGoalPacingFindings(
      [indicator("Ligações", 10, 100)],
      20,
      20,
    );
    expect(result).toHaveLength(1);
    expect(result[0].action).toContain("período acabou");
  });

  it("gera um achado por indicador fora do ritmo", () => {
    const result = detectGoalPacingFindings(
      [
        indicator("Ligações", 10, 100),
        indicator("Vendas", 1, 10),
        indicator("Reuniões", 25, 100),
      ],
      5,
      20,
    );
    expect(result).toHaveLength(2);
  });
});
