import type { Finding } from "./types";

/**
 * Regra 4 (seção 7.4): dias úteis sem report, e reports lançados em
 * atraso. Ausência de dado é falha de disciplina, nunca "zero" (seção 9).
 */
export function detectDisciplineFindings(
  missingBusinessDays: number,
  lateCount: number,
): Finding[] {
  const findings: Finding[] = [];

  if (missingBusinessDays > 0) {
    findings.push({
      rule: "falha-de-disciplina",
      title: "Dias úteis sem preenchimento",
      severity: missingBusinessDays >= 3 ? "critico" : "atencao",
      metric: `${missingBusinessDays} dia(s) útil(eis) sem report no período`,
      action: "Cobre o preenchimento diário — dia sem report não vira zero, vira lacuna no histórico.",
    });
  }

  if (lateCount > 0) {
    findings.push({
      rule: "falha-de-disciplina",
      title: "Reports lançados em atraso",
      severity: lateCount >= 3 ? "atencao" : "observacao",
      metric: `${lateCount} report(s) preenchido(s) fora do dia`,
      action: "Reforce o preenchimento no mesmo dia — atraso frequente compromete o dado em tempo real do time.",
    });
  }

  return findings;
}
