"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteConsultantSchema } from "@/lib/validations/consultant";

export type InviteConsultantState = { error?: string; success?: boolean };

/**
 * Convite de consultora (seção 5/8.4): cria o usuário em auth.users, envia
 * o e-mail de convite com link para /primeiro-acesso, e cria o perfil
 * correspondente. Só admin/gestora podem chamar — verificado aqui mesmo
 * (defesa em profundidade: a tela que chama isto já deveria restringir por
 * papel, mas nunca confiamos só nisso, seção 3).
 */
export async function inviteConsultant(
  _prevState: InviteConsultantState,
  formData: FormData,
): Promise<InviteConsultantState> {
  const parsed = inviteConsultantSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    companyId: formData.get("companyId"),
    startedAt: formData.get("startedAt") || undefined,
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
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  const isAdmin = actorProfile?.role === "admin";
  const isGestoraOwnCompany =
    actorProfile?.role === "gestora" &&
    actorProfile.company_id === parsed.data.companyId;

  if (!isAdmin && !isGestoraOwnCompany) {
    return { error: "Você não tem permissão para convidar consultoras." };
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      // Direto para /primeiro-acesso, não /auth/confirm — ver comentário em
      // recuperar-senha/actions.ts.
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
    role: "consultora",
    started_at: parsed.data.startedAt ?? null,
  });

  if (profileError) {
    // Convite já foi enviado mas o perfil falhou — remove o usuário órfão
    // para não deixar uma conta sem perfil correspondente.
    await admin.auth.admin.deleteUser(invited.user.id);
    return { error: `Não foi possível criar o perfil: ${profileError.message}` };
  }

  return { success: true };
}
