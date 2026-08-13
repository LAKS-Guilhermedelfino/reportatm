import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

/**
 * Timezone de referência do sistema (seção 7.1) — o "dia" do report é a
 * data local em São Paulo, nunca UTC.
 */
export const TIME_ZONE = "America/Sao_Paulo";

/** Data de hoje em America/Sao_Paulo, formato YYYY-MM-DD. */
export function todaySP(): string {
  return formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
}

/** Subtrai `days` dias de uma data YYYY-MM-DD (aritmética de calendário simples). */
export function subDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  // Meio-dia UTC evita problemas de borda de DST/fuso ao só mexer no dia.
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * Janela de edição da consultora (seção 7.2): hoje livre, mais os 2 dias
 * anteriores (marcados como late = true pelo banco).
 */
export function isWithinConsultantEditWindow(
  reportDateISO: string,
  today = todaySP(),
): boolean {
  const earliestEditable = subDaysISO(today, 2);
  return reportDateISO >= earliestEditable && reportDateISO <= today;
}

export function isLateReport(reportDateISO: string, today = todaySP()): boolean {
  return reportDateISO < today;
}

/** Data por extenso em pt-BR, ex.: "quinta-feira, 13 de agosto de 2026". */
export function formatDateLongPtBR(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = toZonedTime(new Date(Date.UTC(y, m - 1, d, 12)), TIME_ZONE);
  return formatInTimeZone(date, TIME_ZONE, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
}
