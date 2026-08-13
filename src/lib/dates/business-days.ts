/**
 * weekday_mask: bit 0 = segunda ... bit 6 = domingo, 1 = dia útil
 * (ver supabase/migrations/..._business_days_and_holidays.sql).
 */
export function isBusinessDay(
  dateISO: string,
  weekdayMask: number,
  holidays: readonly string[] = [],
): boolean {
  if (holidays.includes(dateISO)) return false;

  const [y, m, d] = dateISO.split("-").map(Number);
  const isoWeekday = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() || 7; // domingo=0 -> 7
  const bit = isoWeekday - 1;
  return (weekdayMask & (1 << bit)) !== 0;
}
