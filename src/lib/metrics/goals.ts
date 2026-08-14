/**
 * Atingimento de meta e ritmo esperado (pacing) — seção 7.3. Funções puras,
 * sem acesso a banco: recebem o realizado e a meta já resolvidos.
 */

export type GoalStatus =
  | "atingido"
  | "no-ritmo"
  | "em-risco"
  | "fora-da-meta"
  | "sem-meta";

/** realizado acumulado / meta do período. null quando não há meta definida. */
export function goalAttainment(
  realizado: number,
  meta: number | null,
): number | null {
  if (meta === null || meta <= 0) return null;
  return realizado / meta;
}

/** meta × (dias úteis decorridos / dias úteis totais do período). */
export function expectedPacing(
  meta: number | null,
  businessDaysElapsed: number,
  businessDaysTotal: number,
): number | null {
  if (meta === null || meta <= 0 || businessDaysTotal <= 0) return null;
  return meta * (businessDaysElapsed / businessDaysTotal);
}

/**
 * Atingido: realizado ≥ meta.
 * No ritmo: realizado ≥ 95% do ritmo esperado.
 * Em risco: entre 80% e 95% do ritmo esperado.
 * Fora da meta: abaixo de 80% do ritmo esperado.
 * Sem meta: não há meta cadastrada, ou não dá pra avaliar ritmo (período
 * sem dia útil) — nunca finge um status quando falta dado.
 */
export function goalStatus(
  realizado: number,
  meta: number | null,
  businessDaysElapsed: number,
  businessDaysTotal: number,
): GoalStatus {
  if (meta === null || meta <= 0) return "sem-meta";
  if (realizado >= meta) return "atingido";

  const pacing = expectedPacing(meta, businessDaysElapsed, businessDaysTotal);
  if (pacing === null || pacing <= 0) return "sem-meta";

  const pctOfPacing = realizado / pacing;
  if (pctOfPacing >= 0.95) return "no-ritmo";
  if (pctOfPacing >= 0.8) return "em-risco";
  return "fora-da-meta";
}
