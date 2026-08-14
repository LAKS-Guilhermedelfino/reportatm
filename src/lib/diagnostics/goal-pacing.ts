import { goalAttainment, goalStatus, expectedPacing } from "@/lib/metrics/goals";
import { formatPercent } from "@/lib/format/currency";
import type { Finding } from "./types";

export type PacingIndicator = {
  label: string;
  realizado: number;
  meta: number | null;
  format: (v: number) => string;
};

/**
 * Regra 1 (seção 7.4): qualquer indicador em "em risco" ou "fora da meta"
 * vira um achado, com o gap absoluto e quanto falta fazer por dia útil
 * restante pra recuperar o ritmo.
 */
export function detectGoalPacingFindings(
  indicators: PacingIndicator[],
  businessDaysElapsed: number,
  businessDaysTotal: number,
): Finding[] {
  const findings: Finding[] = [];
  const businessDaysRemaining = businessDaysTotal - businessDaysElapsed;

  for (const indicator of indicators) {
    const status = goalStatus(
      indicator.realizado,
      indicator.meta,
      businessDaysElapsed,
      businessDaysTotal,
    );
    if (status !== "em-risco" && status !== "fora-da-meta") continue;

    const meta = indicator.meta as number; // status só é em-risco/fora-da-meta com meta não nula
    const gap = meta - indicator.realizado;
    const attainment = goalAttainment(indicator.realizado, meta);
    const pacing = expectedPacing(meta, businessDaysElapsed, businessDaysTotal);

    const action =
      businessDaysRemaining > 0
        ? `Faça mais ${indicator.format(gap / businessDaysRemaining)} de ${indicator.label.toLowerCase()} por dia útil restante para recuperar o ritmo.`
        : `O período acabou sem atingir a meta de ${indicator.label.toLowerCase()} — ajuste a meta ou o plano do próximo período.`;

    findings.push({
      rule: "meta-fora-do-ritmo",
      title: `Meta de ${indicator.label} fora do ritmo`,
      severity: status === "fora-da-meta" ? "critico" : "atencao",
      metric: `${indicator.format(indicator.realizado)}/${indicator.format(meta)} (${formatPercent(attainment)}) · ritmo esperado ${pacing !== null ? indicator.format(pacing) : "—"}`,
      action,
    });
  }

  return findings;
}
