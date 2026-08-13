/** Sempre R$ 1.879,36 em pt-BR (seção 9) — nunca ponto decimal solto. */
export function formatBRLCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** "—" quando a taxa é null (denominador zero) — nunca "0%" (seção 9). */
export function formatPercent(value: number | null, digits = 0): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
