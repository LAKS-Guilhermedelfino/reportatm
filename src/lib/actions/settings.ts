"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  businessDaysSchema,
  holidaySchema,
  companyNameSchema,
} from "@/lib/validations/settings";

export type SettingsActionState = { error?: string; success?: boolean };

async function requireGestorCompany() {
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

  if (actor?.role !== "admin" && actor?.role !== "gestora") {
    return { error: "Você não tem permissão para editar configurações." } as const;
  }

  return { supabase, companyId: actor.company_id } as const;
}

export async function updateBusinessDays(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const days = formData.getAll("weekday");
  const mask = days.reduce((acc, d) => acc | (1 << Number(d)), 0);

  const parsed = businessDaysSchema.safeParse({ weekdayMask: mask });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await requireGestorCompany();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("business_days")
    .update({ weekday_mask: parsed.data.weekdayMask })
    .eq("company_id", ctx.companyId);

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function addHoliday(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = holidaySchema.safeParse({
    date: formData.get("date"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await requireGestorCompany();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase.from("holidays").insert({
    company_id: ctx.companyId,
    date: parsed.data.date,
    description: parsed.data.description ?? null,
  });

  if (error) return { error: `Não foi possível adicionar: ${error.message}` };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function deleteHoliday(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const holidayId = formData.get("holidayId") as string;
  if (!holidayId) return { error: "Feriado inválido." };

  const ctx = await requireGestorCompany();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("holidays")
    .delete()
    .eq("id", holidayId)
    .eq("company_id", ctx.companyId);

  if (error) return { error: `Não foi possível remover: ${error.message}` };

  revalidatePath("/configuracoes");
  return { success: true };
}

export async function updateCompanyName(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = companyNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await requireGestorCompany();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("companies")
    .update({ name: parsed.data.name })
    .eq("id", ctx.companyId);

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/configuracoes");
  return { success: true };
}
