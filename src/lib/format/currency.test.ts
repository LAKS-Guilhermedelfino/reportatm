import { describe, expect, it } from "vitest";
import { formatBRLCents, formatPercent } from "./currency";

describe("formatBRLCents", () => {
  it("formata o exemplo da seção 1 (R$ 1.879,36)", () => {
    expect(formatBRLCents(187936)).toBe("R$ 1.879,36");
  });

  it("formata zero", () => {
    expect(formatBRLCents(0)).toBe("R$ 0,00");
  });
});

describe("formatPercent", () => {
  it("retorna — quando null (nunca 0%)", () => {
    expect(formatPercent(null)).toBe("—");
  });

  it("formata uma proporção", () => {
    expect(formatPercent(0.25)).toBe("25%");
  });
});
