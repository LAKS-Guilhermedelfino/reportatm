import { z } from "zod";

// Sem z.coerce: o form (react-hook-form) já produz numbers de verdade via
// NumberStepper/CurrencyInput. FormData (strings) é convertido explicitamente
// no Server Action, antes do parse — mantém o schema com um único shape
// (number) tanto no client quanto pós-parse no server.
const nonNegInt = z
  .number()
  .int("Use um número inteiro.")
  .min(0, "Não pode ser negativo.");

/**
 * Espelha exatamente os campos e checks de supabase/migrations/
 * ..._daily_reports.sql (seção 6, blocos 1–5). Nomes em camelCase no form,
 * convertidos para snake_case só na fronteira com o banco.
 */
export const dailyReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),

  // Bloco 1 — Leads
  newLeadsReceived: nonNegInt,
  newLeadsContacted: nonNegInt,
  oldLeadsContacted: nonNegInt,
  oldLeadsReplied: nonNegInt,

  // Bloco 2 — Follow-ups por temperatura
  followupColdDone: nonNegInt,
  followupColdReplied: nonNegInt,
  followupWarmDone: nonNegInt,
  followupWarmReplied: nonNegInt,
  followupHotDone: nonNegInt,
  followupHotReplied: nonNegInt,

  // Bloco 3 — Ligações
  callsMade: nonNegInt,
  callsAnswered: nonNegInt,

  // Bloco 4 — Reuniões
  meetingsScheduled: nonNegInt,
  meetingsHeld: nonNegInt,

  // Bloco 5 — Comercial
  quotesSent: nonNegInt,
  negotiationsOpen: nonNegInt,
  proposalsSubmitted: nonNegInt,
  salesClosed: nonNegInt,
  salesAmountCents: nonNegInt,

  notes: z.string().max(2000, "Máximo de 2000 caracteres.").optional(),
});

export type DailyReportInput = z.infer<typeof dailyReportSchema>;

export const dailyReportDefaults: Omit<DailyReportInput, "reportDate"> = {
  newLeadsReceived: 0,
  newLeadsContacted: 0,
  oldLeadsContacted: 0,
  oldLeadsReplied: 0,
  followupColdDone: 0,
  followupColdReplied: 0,
  followupWarmDone: 0,
  followupWarmReplied: 0,
  followupHotDone: 0,
  followupHotReplied: 0,
  callsMade: 0,
  callsAnswered: 0,
  meetingsScheduled: 0,
  meetingsHeld: 0,
  quotesSent: 0,
  negotiationsOpen: 0,
  proposalsSubmitted: 0,
  salesClosed: 0,
  salesAmountCents: 0,
  notes: "",
};
