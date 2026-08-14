/**
 * Diagnóstico automático (seção 7.4) — a funcionalidade mais importante do
 * sistema. Regras determinísticas, nunca LLM (seção 13). Cada achado é
 * ancorado num número real do período, nunca texto genérico.
 */

export type Severity = "critico" | "atencao" | "observacao";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critico: 0,
  atencao: 1,
  observacao: 2,
};

export type Finding = {
  /** Identifica a regra que gerou o achado — útil em teste e depuração. */
  rule:
    | "meta-fora-do-ritmo"
    | "gargalo-do-funil"
    | "queda-relativa"
    | "falha-de-disciplina"
    | "esforco-sem-retorno"
    | "retorno-sem-esforco"
    | "followup-desequilibrado"
    | "funil-parado";
  title: string;
  severity: Severity;
  /** O número que comprova o achado. */
  metric: string;
  /** Uma frase de ação recomendada. */
  action: string;
};

export function sortFindingsBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** Limite de 5 achados por relatório (seção 7.4) — não lido além disso. */
export function limitFindings(findings: Finding[], max = 5): Finding[] {
  return sortFindingsBySeverity(findings).slice(0, max);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}
