"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { GOAL_INDICATORS, type GoalIndicatorKey } from "@/lib/metrics/goal-indicators";
import { goalRowSchema, periodTypeSchema } from "@/lib/validations/goal";
import { adjacentPeriod } from "@/lib/dates/periods";
import type { GoalPeriodType } from "@/lib/supabase/types";

export type GoalsActionState = { error?: string; success?: boolean };

async function requireGestorContext(companyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." } as const;

  const { data: actor } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  const isAdmin = actor?.role === "admin";
  const isGestoraOwnCompany =
    actor?.role === "gestora" && actor.company_id === companyId;

  if (!isAdmin && !isGestoraOwnCompany) {
    return { error: "Você não tem permissão para editar metas." } as const;
  }

  return { supabase } as const;
}

/** Encontra a linha existente (por período exato) e faz update, ou insere. */
async function upsertGoalRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  consultantId: string | null,
  periodType: GoalPeriodType,
  periodStart: string,
  periodEnd: string,
  values: Record<GoalIndicatorKey, number | null>,
) {
  let query = supabase
    .from("goals")
    .select("id")
    .eq("company_id", companyId)
    .eq("period_type", periodType)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd);

  query = consultantId
    ? query.eq("consultant_id", consultantId)
    : query.is("consultant_id", null);

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return supabase.from("goals").update(values).eq("id", existing.id);
  }

  return supabase.from("goals").insert({
    company_id: companyId,
    consultant_id: consultantId,
    period_type: periodType,
    period_start: periodStart,
    period_end: periodEnd,
    ...values,
  });
}

/**
 * Salva o grid inteiro de uma vez. FormData carrega companyId, periodType,
 * periodStart, periodEnd, rowIds (CSV de UUIDs + "default"), e um campo
 * `${indicatorKey}__${rowId}` por célula do grid.
 */
export async function saveGoals(
  _prevState: GoalsActionState,
  formData: FormData,
): Promise<GoalsActionState> {
  const companyId = formData.get("companyId") as string;
  const periodTypeRaw = formData.get("periodType") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;
  const rowIds = (formData.get("rowIds") as string)?.split(",").filter(Boolean) ?? [];

  const periodTypeParsed = periodTypeSchema.safeParse(periodTypeRaw);
  if (!periodTypeParsed.success || !companyId || !periodStart || !periodEnd) {
    return { error: "Dados de período inválidos." };
  }

  const ctx = await requireGestorContext(companyId);
  if ("error" in ctx) return { error: ctx.error };

  for (const rowId of rowIds) {
    const raw = Object.fromEntries(
      GOAL_INDICATORS.map((indicator) => [
        indicator.key,
        formData.get(`${indicator.key}__${rowId}`) ?? "",
      ]),
    );
    const parsed = goalRowSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: `Valores inválidos na linha ${rowId}.` };
    }

    const { error } = await upsertGoalRow(
      ctx.supabase,
      companyId,
      rowId === "default" ? null : rowId,
      periodTypeParsed.data,
      periodStart,
      periodEnd,
      parsed.data as Record<GoalIndicatorKey, number | null>,
    );
    if (error) {
      return { error: `Não foi possível salvar: ${error.message}` };
    }
  }

  revalidatePath("/metas");
  revalidatePath("/meu-desempenho");
  return { success: true };
}

/** Copia os valores da linha "meta padrão da empresa" para todas as consultoras. */
export async function applyDefaultGoalToAll(
  _prevState: GoalsActionState,
  formData: FormData,
): Promise<GoalsActionState> {
  const companyId = formData.get("companyId") as string;
  const periodTypeRaw = formData.get("periodType") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;

  const periodTypeParsed = periodTypeSchema.safeParse(periodTypeRaw);
  if (!periodTypeParsed.success || !companyId || !periodStart || !periodEnd) {
    return { error: "Dados de período inválidos." };
  }

  const ctx = await requireGestorContext(companyId);
  if ("error" in ctx) return { error: ctx.error };

  const { data: defaultGoal } = await ctx.supabase
    .from("goals")
    .select(GOAL_INDICATORS.map((i) => i.key).join(","))
    .eq("company_id", companyId)
    .eq("period_type", periodTypeParsed.data)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .is("consultant_id", null)
    .maybeSingle();

  if (!defaultGoal) {
    return { error: "Defina a meta padrão da empresa antes de aplicar a todas." };
  }

  const { data: consultants } = await ctx.supabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId)
    .eq("role", "consultora")
    .eq("active", true);

  for (const consultant of consultants ?? []) {
    const { error } = await upsertGoalRow(
      ctx.supabase,
      companyId,
      consultant.id,
      periodTypeParsed.data,
      periodStart,
      periodEnd,
      defaultGoal as unknown as Record<GoalIndicatorKey, number | null>,
    );
    if (error) {
      return { error: `Não foi possível aplicar: ${error.message}` };
    }
  }

  revalidatePath("/metas");
  revalidatePath("/meu-desempenho");
  return { success: true };
}

/** Copia todas as metas (consultoras + padrão) do período anterior equivalente. */
export async function copyGoalsFromPreviousPeriod(
  _prevState: GoalsActionState,
  formData: FormData,
): Promise<GoalsActionState> {
  const companyId = formData.get("companyId") as string;
  const periodTypeRaw = formData.get("periodType") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;

  const periodTypeParsed = periodTypeSchema.safeParse(periodTypeRaw);
  if (!periodTypeParsed.success || !companyId || !periodStart || !periodEnd) {
    return { error: "Dados de período inválidos." };
  }

  const ctx = await requireGestorContext(companyId);
  if ("error" in ctx) return { error: ctx.error };

  const previous = adjacentPeriod(
    periodTypeParsed.data,
    { start: periodStart, end: periodEnd },
    "prev",
  );

  const { data: previousGoals } = await ctx.supabase
    .from("goals")
    .select(["consultant_id", ...GOAL_INDICATORS.map((i) => i.key)].join(","))
    .eq("company_id", companyId)
    .eq("period_type", periodTypeParsed.data)
    .eq("period_start", previous.start)
    .eq("period_end", previous.end);

  if (!previousGoals || previousGoals.length === 0) {
    return { error: "Não há metas no período anterior para copiar." };
  }

  for (const goal of previousGoals) {
    const g = goal as unknown as { consultant_id: string | null } & Record<
      GoalIndicatorKey,
      number | null
    >;
    const { consultant_id, ...values } = g;
    const { error } = await upsertGoalRow(
      ctx.supabase,
      companyId,
      consultant_id,
      periodTypeParsed.data,
      periodStart,
      periodEnd,
      values as Record<GoalIndicatorKey, number | null>,
    );
    if (error) {
      return { error: `Não foi possível copiar: ${error.message}` };
    }
  }

  revalidatePath("/metas");
  revalidatePath("/meu-desempenho");
  return { success: true };
}
