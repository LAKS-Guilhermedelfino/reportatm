"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteConsultantSchema } from "@/lib/validations/consultant";

export type InviteConsultantState = {
  error?: string;
  success?: boolean;
  createdEmail?: string;
  createdPassword?: string;
};

/**
 * Criação de consultora (seção 5/8.4): cria o usuário em auth.users com
 * senha definida na hora (email_confirm: true) e o perfil correspondente.
 * Só admin/gestora podem chamar — verificado aqui mesmo (defesa em
 * profundidade: a tela que chama isto já deveria restringir por papel, mas
 * nunca confiamos só nisso, seção 3).
 *
 * Sem envio de e-mail — o serviço de e-mail padrão do Supabase tem rate
 * limit baixo (pendência conhecida, ver README) e já bateu nele em uso
 * real. O gestor escolhe/gera a senha e repassa pra consultora por fora.
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
    password: formData.get("password"),
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
    return { error: "Você não tem permissão para cadastrar consultoras." };
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: `Não foi possível criar o usuário: ${createError?.message ?? "erro desconhecido"}` };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    company_id: parsed.data.companyId,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: "consultora",
    started_at: parsed.data.startedAt ?? null,
  });

  if (profileError) {
    // Usuário já foi criado mas o perfil falhou — remove o usuário órfão
    // para não deixar uma conta sem perfil correspondente.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Não foi possível criar o perfil: ${profileError.message}` };
  }

  return {
    success: true,
    createdEmail: parsed.data.email,
    createdPassword: parsed.data.password,
  };
}
