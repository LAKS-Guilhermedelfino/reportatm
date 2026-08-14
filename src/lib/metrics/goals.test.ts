import { describe, expect, it } from "vitest";
import { expectedPacing, goalAttainment, goalStatus } from "./goals";

describe("goalAttainment", () => {
  it("null quando não há meta cadastrada", () => {
    expect(goalAttainment(50, null)).toBeNull();
  });

  it("null quando a meta é zero (não divide por zero)", () => {
    expect(goalAttainment(50, 0)).toBeNull();
  });

  it("calcula a proporção normalmente", () => {
    expect(goalAttainment(80, 100)).toBe(0.8);
  });

  it("pode passar de 100% (meta superada)", () => {
    expect(goalAttainment(120, 100)).toBe(1.2);
  });
});

describe("expectedPacing", () => {
  it("null quando não há meta", () => {
    expect(expectedPacing(null, 5, 10)).toBeNull();
  });

  it("null quando o período não tem nenhum dia útil", () => {
    expect(expectedPacing(100, 0, 0)).toBeNull();
  });

  it("na metade do período, espera metade da meta", () => {
    expect(expectedPacing(100, 5, 10)).toBe(50);
  });

  it("no primeiro dia útil do período", () => {
    expect(expectedPacing(100, 1, 20)).toBe(5);
  });

  it("no último dia útil, ritmo esperado = meta cheia", () => {
    expect(expectedPacing(100, 20, 20)).toBe(100);
  });
});

describe("goalStatus", () => {
  it("sem-meta quando não há meta cadastrada", () => {
    expect(goalStatus(50, null, 5, 10)).toBe("sem-meta");
  });

  it("sem-meta quando o período não tem dia útil (não força um status)", () => {
    expect(goalStatus(0, 100, 0, 0)).toBe("sem-meta");
  });

  it("atingido quando realizado já bate a meta cheia, mesmo no meio do período", () => {
    expect(goalStatus(100, 100, 5, 20)).toBe("atingido");
  });

  it("atingido quando realizado supera a meta", () => {
    expect(goalStatus(150, 100, 20, 20)).toBe("atingido");
  });

  it("no-ritmo quando realizado ≥ 95% do ritmo esperado", () => {
    // metade do período, ritmo esperado = 50, realizado 48 = 96% do ritmo
    expect(goalStatus(48, 100, 10, 20)).toBe("no-ritmo");
  });

  it("em-risco entre 80% e 95% do ritmo esperado", () => {
    // ritmo esperado = 50, realizado 40 = 80% do ritmo
    expect(goalStatus(40, 100, 10, 20)).toBe("em-risco");
  });

  it("fora-da-meta abaixo de 80% do ritmo esperado", () => {
    // ritmo esperado = 50, realizado 30 = 60% do ritmo
    expect(goalStatus(30, 100, 10, 20)).toBe("fora-da-meta");
  });

  it("no dia 5 do mês, não compara contra a meta cheia (o exemplo do claude.md)", () => {
    // meta mensal 220, 5 de 22 dias úteis decorridos -> ritmo esperado = 50
    // realizado 48 no dia 5: não deveria ser "fora da meta" só por estar longe de 220.
    expect(goalStatus(48, 220, 5, 22)).toBe("no-ritmo");
  });
});
