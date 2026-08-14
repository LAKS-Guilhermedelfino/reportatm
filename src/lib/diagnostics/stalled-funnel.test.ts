import { describe, expect, it } from "vitest";
import { detectStalledFunnel } from "./stalled-funnel";

describe("detectStalledFunnel", () => {
  it("null quando há menos de 7 dias de dado", () => {
    expect(detectStalledFunnel([3, 3, 3, 3, 3, 3], 0)).toBeNull();
  });

  it("null quando houve venda no período", () => {
    expect(detectStalledFunnel([3, 3, 3, 3, 3, 3, 3], 1)).toBeNull();
  });

  it("null quando não há negociação em aberto (média zero)", () => {
    expect(detectStalledFunnel([0, 0, 0, 0, 0, 0, 0], 0)).toBeNull();
  });

  it("null quando a série varia bastante (não é estável)", () => {
    expect(detectStalledFunnel([1, 5, 2, 8, 1, 6, 3], 0)).toBeNull();
  });

  it("detecta funil parado: estável, sem venda, com negociação aberta", () => {
    const finding = detectStalledFunnel([4, 4, 3, 4, 4, 3, 4, 4], 0);
    expect(finding).not.toBeNull();
    expect(finding!.rule).toBe("funil-parado");
    expect(finding!.metric).toContain("8 dias");
  });

  it("tolera pequena variação de 1 unidade e ainda considera estável", () => {
    const finding = detectStalledFunnel([3, 4, 3, 4, 3, 4, 3], 0);
    expect(finding).not.toBeNull();
  });
});
