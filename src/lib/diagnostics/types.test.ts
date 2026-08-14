import { describe, expect, it } from "vitest";
import { limitFindings, median, sortFindingsBySeverity, type Finding } from "./types";

function f(severity: Finding["severity"], title: string): Finding {
  return { rule: "meta-fora-do-ritmo", title, severity, metric: "x", action: "y" };
}

describe("median", () => {
  it("null para lista vazia", () => {
    expect(median([])).toBeNull();
  });

  it("valor do meio em lista ímpar", () => {
    expect(median([1, 3, 2])).toBe(2);
  });

  it("média dos dois do meio em lista par", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("sortFindingsBySeverity", () => {
  it("crítico primeiro, depois atenção, depois observação", () => {
    const findings = [f("observacao", "c"), f("critico", "a"), f("atencao", "b")];
    expect(sortFindingsBySeverity(findings).map((x) => x.title)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("limitFindings", () => {
  it("limita a 5 achados, mantendo os mais severos", () => {
    const findings = Array.from({ length: 8 }, (_, i) =>
      f(i < 2 ? "critico" : "observacao", `f${i}`),
    );
    const result = limitFindings(findings);
    expect(result).toHaveLength(5);
    expect(result.filter((r) => r.severity === "critico")).toHaveLength(2);
  });
});
