import { describe, expect, it } from "vitest";
import { detectDisciplineFindings } from "./discipline";

describe("detectDisciplineFindings", () => {
  it("nenhum achado quando não há falta nem atraso", () => {
    expect(detectDisciplineFindings(0, 0)).toHaveLength(0);
  });

  it("achado de atenção para 1-2 dias faltando", () => {
    const result = detectDisciplineFindings(2, 0);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("atencao");
    expect(result[0].metric).toContain("2");
  });

  it("achado crítico para 3+ dias faltando", () => {
    const result = detectDisciplineFindings(3, 0);
    expect(result[0].severity).toBe("critico");
  });

  it("achado de observação para poucos atrasos", () => {
    const result = detectDisciplineFindings(0, 1);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("observacao");
  });

  it("achado de atenção para 3+ atrasos", () => {
    const result = detectDisciplineFindings(0, 3);
    expect(result[0].severity).toBe("atencao");
  });

  it("gera os dois achados quando há falta e atraso juntos", () => {
    const result = detectDisciplineFindings(1, 1);
    expect(result).toHaveLength(2);
  });
});
