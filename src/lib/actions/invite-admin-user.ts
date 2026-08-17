"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteAdminUserSchema } from "@/lib/validations/admin-user";

export type InviteAdminUserState = {
  error?: string;
  success?: boolean;
  createdEmail?: string;
  createdPassword?: string;
};

/**
 * Criação de admin/gestora (acesso master, seção 5) — distinto do convite
 * de consultora em invite-consultant.ts. Só quem já é admin pode chamar,
 * verificado aqui mesmo (defesa em profundidade — a tela só é alcançável
 * por admin, mas nunca confiamos só nisso).
 *
 * Cria com senha definida na hora (email_confirm: true) em vez de convite
 * por e-mail — o serviço de e-mail padrão do Supabase tem rate limit baixo
 * (pendência conhecida, ver README), então aqui o admin escolhe a senha e
 * repassa pra pessoa por fora.
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (actorProfile?.role !== "admin") {
    return { error: "Só administradores podem criar outros administradores/gestoras." };
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
    role: parsed.data.role,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: `Não foi possível criar o perfil: ${profileError.message}` };
  }

  return {
    success: true,
    createdEmail: parsed.data.email,
    createdPassword: parsed.data.password,
  };
}
