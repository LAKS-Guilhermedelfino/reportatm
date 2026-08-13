/**
 * Espelha src/styles/tokens.css. Existe porque bibliotecas de gráfico SVG
 * (Recharts) recebem cor via atributo/style e não resolvem var(--...) de
 * forma confiável — é a única exceção documentada à regra de "nenhum hex
 * solto", e mesmo assim fica centralizada aqui, não espalhada nos componentes.
 */
export const CHART_COLORS = {
  primary: "#FF4200",
  grey: "#B5B5B5",
  success: "#22C55E",
  warning: "#F5A524",
  danger: "#EF4444",
} as const;
