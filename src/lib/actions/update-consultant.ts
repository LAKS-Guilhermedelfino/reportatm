"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateConsultantSchema } from "@/lib/validations/consultant";

export type UpdateConsultantState = { error?: string; success?: boolean };

async function requireGestorContext(consultantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." } as const;

  const [{ data: actor }, { data: target }] = await Promise.all([
    supabase.from("profiles").select("role, company_id").eq("id", user.id).single(),
    supabase.from("profiles").select("company_id, role").eq("id", consultantId).single(),
  ]);

  const isAdmin = actor?.role === "admin";
  const isGestoraOwnCompany =
    actor?.role === "gestora" && actor.company_id === target?.company_id;

  if (!target || target.role !== "consultora" || (!isAdmin && !isGestoraOwnCompany)) {
    return { error: "Você não tem permissão para editar essa consultora." } as const;
  }

  return { supabase } as const;
}

export async function updateConsultant(
  _prevState: UpdateConsultantState,
  formData: FormData,
): Promise<UpdateConsultantState> {
  const parsed = updateConsultantSchema.safeParse({
    consultantId: formData.get("consultantId"),
    fullName: formData.get("fullName"),
    startedAt: formData.get("startedAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const ctx = await requireGestorContext(parsed.data.consultantId);
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      started_at: parsed.data.startedAt ?? null,
    })
    .eq("id", parsed.data.consultantId);

  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/consultoras");
  return { success: true };
}

/** Desativar não apaga histórico (seção 8.3) — só marca active=false. */
export async function setConsultantActive(
  _prevState: UpdateConsultantState,
  formData: FormData,
): Promise<UpdateConsultantState> {
  const consultantId = formData.get("consultantId") as string;
  const active = formData.get("active") === "true";

  if (!consultantId) return { error: "Consultora inválida." };

  const ctx = await requireGestorContext(consultantId);
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("profiles")
    .update({ active })
    .eq("id", consultantId);

  if (error) return { error: `Não foi possível atualizar: ${error.message}` };

  revalidatePath("/consultoras");
  return { success: true };
}
