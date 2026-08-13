import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { subDaysISO } from "@/lib/dates/sao-paulo";
import { isBusinessDay } from "@/lib/dates/business-days";
import type { DailyReportInput } from "@/lib/validations/daily-report";

export async function getReportPageData(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string,
  targetDate: string,
  today: string,
) {
  const twoDaysAgo = subDaysISO(today, 2);

  const [
    { data: existing },
    { data: recentReports },
    { data: businessDays },
    { data: holidays },
  ] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("*")
      .eq("consultant_id", userId)
      .eq("report_date", targetDate)
      .maybeSingle(),
    supabase
      .from("daily_reports")
      .select("report_date")
      .eq("consultant_id", userId)
      .gte("report_date", twoDaysAgo)
      .lte("report_date", today),
    supabase
      .from("business_days")
      .select("weekday_mask")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("holidays")
      .select("date")
      .eq("company_id", companyId)
      .gte("date", twoDaysAgo)
      .lte("date", today),
  ]);

  const filledDates = new Set((recentReports ?? []).map((r) => r.report_date));
  const holidayDates = (holidays ?? []).map((h) => h.date);
  const weekdayMask = businessDays?.weekday_mask ?? 31;

  const openDays = [subDaysISO(today, 1), subDaysISO(today, 2)].filter(
    (date) =>
      date !== targetDate &&
      !filledDates.has(date) &&
      isBusinessDay(date, weekdayMask, holidayDates),
  );

  const defaultValues: DailyReportInput | undefined = existing
    ? {
        reportDate: existing.report_date,
        newLeadsReceived: existing.new_leads_received,
        newLeadsContacted: existing.new_leads_contacted,
        oldLeadsContacted: existing.old_leads_contacted,
        oldLeadsReplied: existing.old_leads_replied,
        followupColdDone: existing.followup_cold_done,
        followupColdReplied: existing.followup_cold_replied,
        followupWarmDone: existing.followup_warm_done,
        followupWarmReplied: existing.followup_warm_replied,
        followupHotDone: existing.followup_hot_done,
        followupHotReplied: existing.followup_hot_replied,
        callsMade: existing.calls_made,
        callsAnswered: existing.calls_answered,
        meetingsScheduled: existing.meetings_scheduled,
        meetingsHeld: existing.meetings_held,
        quotesSent: existing.quotes_sent,
        negotiationsOpen: existing.negotiations_open,
        proposalsSubmitted: existing.proposals_submitted,
        salesClosed: existing.sales_closed,
        salesAmountCents: existing.sales_amount_cents,
        notes: existing.notes ?? "",
      }
    : undefined;

  return { defaultValues, openDays, alreadyFilled: Boolean(existing) };
}
