import { formatPercent } from "@/lib/format/currency";
import { median, type Finding } from "./types";

export type EffortReturnActivity = {
  label: string;
  herVolume: number;
  teamVolumes: number[];
  /** Meta da consultora pro indicador de volume — só usada na regra 6. */
  volumeGoal: number | null;
};

/**
 * Regras 5 e 6 (seção 7.4): esforço sem retorno (volume acima da mediana,
 * conversão abaixo) e retorno sem esforço (conversão acima da mediana,
 * volume abaixo da meta — capacidade ociosa). Mutuamente exclusivas por
 * atividade, porque dependem de lados opostos da mediana de conversão.
 */
export function detectEffortReturnFindings(
  activities: EffortReturnActivity[],
  herConversion: number | null,
  teamConversions: number[],
): Finding[] {
  if (herConversion === null) return [];
  const conversionMedian = median(teamConversions);
  if (conversionMedian === null) return [];

  const findings: Finding[] = [];

  for (const activity of activities) {
    const volumeMedian = median(activity.teamVolumes);
    if (volumeMedian === null) continue;

    if (activity.herVolume > volumeMedian && herConversion < conversionMedian) {
      findings.push({
        rule: "esforco-sem-retorno",
        title: `Esforço sem retorno em ${activity.label.toLowerCase()}`,
        severity: "atencao",
        metric: `${activity.herVolume} ${activity.label.toLowerCase()} (mediana do time: ${volumeMedian}) · conversão ${formatPercent(herConversion)} (mediana ${formatPercent(conversionMedian)})`,
        action: `Volume de ${activity.label.toLowerCase()} acima da mediana do time, mas a conversão está abaixo — revise a abordagem, não o esforço.`,
      });
      continue;
    }

    if (
      herConversion > conversionMedian &&
      activity.volumeGoal !== null &&
      activity.herVolume < activity.volumeGoal
    ) {
      findings.push({
        rule: "retorno-sem-esforco",
        title: `Capacidade ociosa em ${activity.label.toLowerCase()}`,
        severity: "observacao",
        metric: `conversão ${formatPercent(herConversion)} (mediana ${formatPercent(conversionMedian)}) · ${activity.herVolume}/${activity.volumeGoal} de ${activity.label.toLowerCase()}`,
        action: `Conversão acima da mediana do time com volume abaixo da meta em ${activity.label.toLowerCase()} — aumentar o volume tende a gerar mais vendas.`,
      });
    }
  }

  return findings;
}
