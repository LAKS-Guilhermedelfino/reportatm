import { Archivo, Inter } from "next/font/google";

/**
 * Fontes oficiais da marca (Neuething Sans / Helvetica Neue) ainda não foram
 * fornecidas — ver PLAN.md, "Decisões já confirmadas". Usando a alternativa
 * prevista no claude.md, seção 4.2: Archivo Expanded (títulos) + Inter (texto).
 * Quando os arquivos reais chegarem em `LAKS COMPANY [IDV]/Documents font/`,
 * trocar por next/font/local apontando para /public/fonts, mantendo os mesmos
 * nomes de variável CSS (--font-heading / --font-body) para não tocar no resto do app.
 */
export const fontHeading = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-heading-sans",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body-sans",
  display: "swap",
});
