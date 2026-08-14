import { describe, expect, it } from "vitest";
import { detectFollowupImbalance } from "./followup-balance";

describe("detectFollowupImbalance", () => {
  it("null quando não há follow-up nenhum", () => {
    expect(detectFollowupImbalance(0, 0, 0)).toBeNull();
  });

  it("null quando está balanceado", () => {
    expect(detectFollowupImbalance(5, 5, 5)).toBeNull();
  });

  it("null exatamente em 70% (só dispara acima)", () => {
    expect(detectFollowupImbalance(7, 2, 1)).toBeNull();
  });

  it("detecta concentração em frios acima de 70%", () => {
    const finding = detectFollowupImbalance(8, 1, 1);
    expect(finding).not.toBeNull();
    expect(finding!.metric).toContain("frios");
  });

  it("severidade atenção quando concentração é extrema (90%+)", () => {
    const finding = detectFollowupImbalance(9, 1, 0);
    expect(finding!.severity).toBe("atencao");
  });

  it("severidade observação entre 70% e 90%", () => {
    const finding = detectFollowupImbalance(8, 1, 1);
    expect(finding!.severity).toBe("observacao");
  });

  it("identifica corretamente a temperatura quente como dominante", () => {
    const finding = detectFollowupImbalance(1, 1, 8);
    expect(finding!.metric).toContain("quentes");
  });
});
