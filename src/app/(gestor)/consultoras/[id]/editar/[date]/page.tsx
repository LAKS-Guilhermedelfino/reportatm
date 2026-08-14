import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { DailyReportInput } from "@/lib/validations/daily-report";
import { AdminReportForm } from "./admin-report-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function EditarReportPage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const supabase = await createClient();
  const { data: consultant } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .single();
  if (!consultant) notFound();

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("consultant_id", id)
    .eq("report_date", date)
    .maybeSingle();

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

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">{consultant.full_name}</p>
      <AdminReportForm consultantId={id} reportDate={date} defaultValues={defaultValues} />
    </div>
  );
}
