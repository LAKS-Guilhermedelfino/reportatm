import { formatPercent } from "@/lib/format/currency";
import type { Finding } from "./types";

const IMBALANCE_THRESHOLD = 0.7; // seção 7.4: mais de 70%

/**
 * Regra 7 (seção 7.4): mais de 70% dos follow-ups concentrados numa única
 * temperatura.
 */
export function detectFollowupImbalance(
  cold: number,
  warm: number,
  hot: number,
): Finding | null {
  const total = cold + warm + hot;
  if (total === 0) return null;

  const buckets = [
    { label: "frios", value: cold },
    { label: "mornos", value: warm },
    { label: "quentes", value: hot },
  ];
  const dominant = buckets.reduce((a, b) => (b.value > a.value ? b : a));
  const share = dominant.value / total;

  if (share <= IMBALANCE_THRESHOLD) return null;

  return {
    rule: "followup-desequilibrado",
    title: "Follow-up desequilibrado",
    severity: share >= 0.9 ? "atencao" : "observacao",
    metric: `${formatPercent(share)} dos follow-ups são ${dominant.label} (${dominant.value}/${total})`,
    action: `Distribua o esforço de follow-up entre as temperaturas — concentração em "${dominant.label}" pode indicar leads parados numa etapa do funil.`,
  };
}
