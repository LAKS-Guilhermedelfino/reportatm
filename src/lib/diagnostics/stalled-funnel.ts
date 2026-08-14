import type { Finding } from "./types";

const MIN_DAYS = 7; // seção 7.4: "mais de 7 dias"
const STABILITY_TOLERANCE = 1; // variação máxima aceita pra considerar "estável"

/**
 * Regra 8 (seção 7.4): negotiations_open alto e estável há mais de 7 dias
 * sem vendas correspondentes. "Alto" aqui é lido como "há negociação em
 * aberto" (média > 0) — a marca não define um patamar numérico, e
 * inventar um esconderia o sinal real, que é o funil não andar.
 */
export function detectStalledFunnel(
  negotiationsOpenSeries: number[],
  salesClosedInWindow: number,
): Finding | null {
  if (negotiationsOpenSeries.length < MIN_DAYS) return null;
  if (salesClosedInWindow > 0) return null;

  const avg =
    negotiationsOpenSeries.reduce((a, b) => a + b, 0) / negotiationsOpenSeries.length;
  if (avg <= 0) return null;

  const max = Math.max(...negotiationsOpenSeries);
  const min = Math.min(...negotiationsOpenSeries);
  if (max - min > STABILITY_TOLERANCE) return null;

  return {
    rule: "funil-parado",
    title: "Funil parado",
    severity: "atencao",
    metric: `~${Math.round(avg)} negociação(ões) em andamento estável há ${negotiationsOpenSeries.length} dias, sem venda nesse período`,
    action: "Revise as negociações em aberto com ela — sinal de funil travado, sem avanço nem fechamento.",
  };
}
