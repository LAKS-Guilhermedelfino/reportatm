import { isBusinessDay } from "./business-days";
import { subDaysISO } from "./sao-paulo";

export type PeriodType = "weekly" | "biweekly" | "monthly" | "daily" | "custom";

export type Period = { start: string; end: string };

function toUTCNoon(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Segunda a domingo, ISO 8601 (seção 7.1). */
export function getWeekPeriod(referenceDateISO: string): Period {
  const date = toUTCNoon(referenceDateISO);
  const isoWeekday = date.getUTCDay() || 7; // domingo=0 -> 7 (segunda=1..domingo=7)
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - (isoWeekday - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: toISO(monday), end: toISO(sunday) };
}

/** Dias 1–15 e 16 até o último dia do mês (seção 7.1). */
export function getBiweeklyPeriod(referenceDateISO: string): Period {
  const [y, m, d] = referenceDateISO.split("-").map(Number);
  if (d <= 15) {
    return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-15` };
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${y}-${pad(m)}-16`, end: `${y}-${pad(m)}-${pad(lastDay)}` };
}

/** Mês-calendário (seção 7.1). */
export function getMonthPeriod(referenceDateISO: string): Period {
  const [y, m] = referenceDateISO.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(lastDay)}` };
}

export function getPeriod(
  type: PeriodType,
  referenceDateISO: string,
  custom?: Period,
): Period {
  switch (type) {
    case "weekly":
      return getWeekPeriod(referenceDateISO);
    case "biweekly":
      return getBiweeklyPeriod(referenceDateISO);
    case "monthly":
      return getMonthPeriod(referenceDateISO);
    case "daily":
      return { start: referenceDateISO, end: referenceDateISO };
    case "custom":
      if (!custom) throw new Error("Período customizado precisa de start/end.");
      return custom;
  }
}

/** Período anterior/seguinte, pra navegação (‹ Semana anterior › etc). */
export function adjacentPeriod(
  type: PeriodType,
  period: Period,
  direction: "prev" | "next",
): Period {
  if (type === "custom") {
    const spanDays = dateRangeArray(period.start, period.end).length;
    return direction === "prev"
      ? {
          start: subDaysISO(period.start, spanDays),
          end: subDaysISO(period.end, spanDays),
        }
      : {
          start: subDaysISO(period.start, -spanDays),
          end: subDaysISO(period.end, -spanDays),
        };
  }

  const referenceDate =
    direction === "prev"
      ? subDaysISO(period.start, 1)
      : subDaysISO(period.end, -1);
  return getPeriod(type, referenceDate);
}

/** Todas as datas (YYYY-MM-DD) entre start e end, inclusive. */
export function dateRangeArray(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  let cur = toUTCNoon(startISO);
  const end = toUTCNoon(endISO);
  while (cur.getTime() <= end.getTime()) {
    dates.push(toISO(cur));
    const next = new Date(cur);
    next.setUTCDate(next.getUTCDate() + 1);
    cur = next;
  }
  return dates;
}

export function countBusinessDays(
  startISO: string,
  endISO: string,
  weekdayMask: number,
  holidays: readonly string[] = [],
): number {
  return dateRangeArray(startISO, endISO).filter((d) =>
    isBusinessDay(d, weekdayMask, holidays),
  ).length;
}
