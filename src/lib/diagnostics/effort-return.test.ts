import { describe, expect, it } from "vitest";
import { detectEffortReturnFindings, type EffortReturnActivity } from "./effort-return";

function activity(overrides: Partial<EffortReturnActivity>): EffortReturnActivity {
  return {
    label: "Ligações",
    herVolume: 100,
    teamVolumes: [50, 60, 70],
    volumeGoal: null,
    ...overrides,
  };
}

describe("detectEffortReturnFindings", () => {
  it("nenhum achado quando não há conversão dela", () => {
    expect(detectEffortReturnFindings([activity({})], null, [0.1, 0.2])).toHaveLength(0);
  });

  it("nenhum achado quando não há dado de conversão do time", () => {
    expect(detectEffortReturnFindings([activity({})], 0.1, [])).toHaveLength(0);
  });

  it("esforço sem retorno: volume acima da mediana, conversão abaixo", () => {
    const result = detectEffortReturnFindings(
      [activity({ herVolume: 100, teamVolumes: [50, 60, 70] })], // mediana 60
      0.05, // conversão dela
      [0.1, 0.2, 0.3], // mediana 0.2 — ela está abaixo
    );
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe("esforco-sem-retorno");
    expect(result[0].severity).toBe("atencao");
  });

  it("retorno sem esforço: conversão acima da mediana, volume abaixo da meta", () => {
    const result = detectEffortReturnFindings(
      [activity({ herVolume: 30, teamVolumes: [50, 60, 70], volumeGoal: 100 })],
      0.5,
      [0.1, 0.2, 0.3], // mediana 0.2 — ela está acima
    );
    expect(result).toHaveLength(1);
    expect(result[0].rule).toBe("retorno-sem-esforco");
    expect(result[0].severity).toBe("observacao");
  });

  it("sem achado de retorno-sem-esforço quando não há meta de volume", () => {
    const result = detectEffortReturnFindings(
      [activity({ herVolume: 30, teamVolumes: [50, 60, 70], volumeGoal: null })],
      0.5,
      [0.1, 0.2, 0.3],
    );
    expect(result).toHaveLength(0);
  });

  it("nenhum achado quando volume e conversão estão alinhados com o time", () => {
    const result = detectEffortReturnFindings(
      [activity({ herVolume: 60, teamVolumes: [50, 60, 70] })],
      0.2,
      [0.1, 0.2, 0.3],
    );
    expect(result).toHaveLength(0);
  });

  it("avalia múltiplas atividades independentemente", () => {
    const result = detectEffortReturnFindings(
      [
        activity({ label: "Ligações", herVolume: 100, teamVolumes: [50, 60] }),
        activity({ label: "Follow-ups", herVolume: 10, teamVolumes: [50, 60] }),
      ],
      0.05,
      [0.1, 0.2, 0.3],
    );
    expect(result).toHaveLength(1);
    expect(result[0].title).toContain("ligações");
  });
});
