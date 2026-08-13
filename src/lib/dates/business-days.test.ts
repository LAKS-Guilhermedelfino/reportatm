import { describe, expect, it } from "vitest";
import { isBusinessDay } from "./business-days";

const MON_FRI = 31; // 0011111

describe("isBusinessDay", () => {
  it("segunda a sexta são dias úteis com a máscara padrão", () => {
    expect(isBusinessDay("2026-08-10", MON_FRI)).toBe(true); // segunda
    expect(isBusinessDay("2026-08-11", MON_FRI)).toBe(true); // terça
    expect(isBusinessDay("2026-08-14", MON_FRI)).toBe(true); // sexta
  });

  it("sábado e domingo não são dias úteis com a máscara padrão", () => {
    expect(isBusinessDay("2026-08-15", MON_FRI)).toBe(false); // sábado
    expect(isBusinessDay("2026-08-16", MON_FRI)).toBe(false); // domingo
  });

  it("feriado não é dia útil mesmo em dia de semana", () => {
    expect(isBusinessDay("2026-08-10", MON_FRI, ["2026-08-10"])).toBe(false);
  });

  it("máscara customizada (ex.: inclui sábado)", () => {
    const monToSat = 63; // 0111111
    expect(isBusinessDay("2026-08-15", monToSat)).toBe(true);
    expect(isBusinessDay("2026-08-16", monToSat)).toBe(false);
  });
});
