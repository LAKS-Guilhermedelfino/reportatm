"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dailyReportSchema } from "@/lib/validations/daily-report";

export type AdminDailyReportState = { error?: string; success?: boolean };

const NUMERIC_FIELDS = [
  "newLeadsReceived",
  "newLeadsContacted",
  "oldLeadsContacted",
  "oldLeadsReplied",
  "followupColdDone",
  "followupColdReplied",
  "followupWarmDone",
  "followupWarmReplied",
  "followupHotDone",
  "followupHotReplied",
  "callsMade",
  "callsAnswered",
  "meetingsScheduled",
  "meetingsHeld",
  "quotesSent",
  "negotiationsOpen",
  "proposalsSubmitted",
  "salesClosed",
  "salesAmountCents",
] as const;

function parseFormData(formData: FormData): Record<string, unknown> {
  const raw = Object.fromEntries(formData.entries());
  const parsed: Record<string, unknown> = { ...raw };
  for (const field of NUMERIC_FIELDS) {
    if (field in raw) parsed[field] = Number(raw[field]);
  }
  return parsed;
}

/**
 * Admin/gestora editam o report de qualquer data (seção 7.2) — sem a
 * janela de 2 dias que vale só pra consultora. A trigger de audit_log já
 * cobre isso automaticamente (loga sempre que o ator é admin/gestora).
 */
export async function adminUpdateDailyReport(
  _prevState: AdminDailyReportState,
  formData: FormData,
): Promise<AdminDailyReportState> {
  const consultantId = formData.get("consultantId") as string;
  const parsed = dailyReportSchema.safeParse(parseFormData(formData));

  if (!consultantId || !parsed.success) {
    return { error: parsed.success ? "Consultora inválida." : parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const [{ data: actor }, { data: target }] = await Promise.all([
    supabase.from("profiles").select("role, company_id").eq("id", user.id).single(),
    supabase.from("profiles").select("company_id, role").eq("id", consultantId).single(),
  ]);

  const isAdmin = actor?.role === "admin";
  const isGestoraOwnCompany =
    actor?.role === "gestora" && actor.company_id === target?.company_id;

  if (!target || target.role !== "consultora" || (!isAdmin && !isGestoraOwnCompany)) {
    return { error: "Você não tem permissão para editar esse report." };
  }

  const { error } = await supabase.from("daily_reports").upsert(
    {
      company_id: target.company_id,
      consultant_id: consultantId,
      report_date: parsed.data.reportDate,
      filled_by: user.id,
      new_leads_received: parsed.data.newLeadsReceived,
      new_leads_contacted: parsed.data.newLeadsContacted,
      old_leads_contacted: parsed.data.oldLeadsContacted,
      old_leads_replied: parsed.data.oldLeadsReplied,
      followup_cold_done: parsed.data.followupColdDone,
      followup_cold_replied: parsed.data.followupColdReplied,
      followup_warm_done: parsed.data.followupWarmDone,
      followup_warm_replied: parsed.data.followupWarmReplied,
      followup_hot_done: parsed.data.followupHotDone,
      followup_hot_replied: parsed.data.followupHotReplied,
      calls_made: parsed.data.callsMade,
      calls_answered: parsed.data.callsAnswered,
      meetings_scheduled: parsed.data.meetingsScheduled,
      meetings_held: parsed.data.meetingsHeld,
      quotes_sent: parsed.data.quotesSent,
      negotiations_open: parsed.data.negotiationsOpen,
      proposals_submitted: parsed.data.proposalsSubmitted,
      sales_closed: parsed.data.salesClosed,
      sales_amount_cents: parsed.data.salesAmountCents,
      notes: parsed.data.notes || null,
    },
    { onConflict: "consultant_id,report_date" },
  );

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath(`/consultoras/${consultantId}`);
  return { success: true };
}
