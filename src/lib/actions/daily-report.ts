"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dailyReportSchema } from "@/lib/validations/daily-report";
import { isWithinConsultantEditWindow, subDaysISO } from "@/lib/dates/sao-paulo";

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

/** FormData só sabe entregar strings — vira number aqui, na fronteira. */
function parseFormData(formData: FormData): Record<string, unknown> {
  const raw = Object.fromEntries(formData.entries());
  const parsed: Record<string, unknown> = { ...raw };
  for (const field of NUMERIC_FIELDS) {
    if (field in raw) parsed[field] = Number(raw[field]);
  }
  return parsed;
}

export type ReportSummary = {
  callsMade: number;
  followupTotal: number;
  meetingsHeld: number;
  salesClosed: number;
  salesAmountCents: number;
};

export type SubmitDailyReportState = {
  error?: string;
  success?: boolean;
  today?: ReportSummary;
  weekAverage?: ReportSummary;
};

/**
 * Grava o report do dia da PRÓPRIA consultora (consultant_id = auth.uid()).
 * Editar o report de outra pessoa é capacidade do admin/gestora, adicionada
 * na Fase 6 (/consultoras/[id]) com uma action separada.
 */
export async function submitDailyReport(
  _prevState: SubmitDailyReportState,
  formData: FormData,
): Promise<SubmitDailyReportState> {
  const parsed = dailyReportSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!isWithinConsultantEditWindow(parsed.data.reportDate)) {
    return {
      error:
        "Essa data não pode mais ser editada (fora da janela de hoje + 2 dias).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Perfil não encontrado." };
  }

  const { error } = await supabase.from("daily_reports").upsert(
    {
      company_id: profile.company_id,
      consultant_id: user.id,
      report_date: parsed.data.reportDate,
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

  if (error) {
    return { error: `Não foi possível salvar: ${error.message}` };
  }

  revalidatePath("/meu-report");
  revalidatePath("/meu-report/historico");

  const today: ReportSummary = {
    callsMade: parsed.data.callsMade,
    followupTotal:
      parsed.data.followupColdDone +
      parsed.data.followupWarmDone +
      parsed.data.followupHotDone,
    meetingsHeld: parsed.data.meetingsHeld,
    salesClosed: parsed.data.salesClosed,
    salesAmountCents: parsed.data.salesAmountCents,
  };

  const weekStart = subDaysISO(parsed.data.reportDate, 7);
  const weekEnd = subDaysISO(parsed.data.reportDate, 1);
  const { data: pastWeek } = await supabase
    .from("daily_reports")
    .select(
      "calls_made, followup_cold_done, followup_warm_done, followup_hot_done, meetings_held, sales_closed, sales_amount_cents",
    )
    .eq("consultant_id", user.id)
    .gte("report_date", weekStart)
    .lte("report_date", weekEnd);

  const days = pastWeek?.length ?? 0;
  const weekAverage: ReportSummary | undefined = pastWeek?.length
    ? {
        callsMade: sumBy(pastWeek, (r) => r.calls_made) / days,
        followupTotal:
          sumBy(
            pastWeek,
            (r) =>
              r.followup_cold_done + r.followup_warm_done + r.followup_hot_done,
          ) / days,
        meetingsHeld: sumBy(pastWeek, (r) => r.meetings_held) / days,
        salesClosed: sumBy(pastWeek, (r) => r.sales_closed) / days,
        salesAmountCents: sumBy(pastWeek, (r) => r.sales_amount_cents) / days,
      }
    : undefined;

  return { success: true, today, weekAverage };
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((acc, item) => acc + fn(item), 0);
}
