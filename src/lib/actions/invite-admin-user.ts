"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteAdminUserSchema } from "@/lib/validations/admin-user";

export type InviteAdminUserState = { error?: string; success?: boolean };

/**
 * Convite de admin/gestora (acesso master, seção 5) — distinto do convite
 * de consultora em invite-consultant.ts. Só quem já é admin pode chamar,
 * verificado aqui mesmo (defesa em profundidade — a tela só é alcançável
 * por admin, mas nunca confiamos só nisso).
 */
export async function inviteAdminUser(
  _prevState: InviteAdminUserState,
  formData: FormData,
): Promise<InviteAdminUserState> {
  const parsed = inviteAdminUserSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    companyId: formData.get("companyId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada." };
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (actorProfile?.role !== "admin") {
    return { error: "Só administradores podem convidar outros administradores/gestoras." };
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/primeiro-acesso`,
    });

  if (inviteError || !invited.user) {
    return { error: `Não foi possível enviar o convite: ${inviteError?.message ?? "erro desconhecido"}` };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    company_id: parsed.data.companyId,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: parsed.data.role,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return { error: `Não foi possível criar o perfil: ${profileError.message}` };
  }

  return { success: true };
}
