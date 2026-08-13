"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPasswordSchema } from "@/lib/validations/auth";

export type SetPasswordState = { error?: string };

export async function setPassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?erro=sessao_expirada");
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Não foi possível salvar a senha. Tente novamente." };
  }

  redirect("/");
}
