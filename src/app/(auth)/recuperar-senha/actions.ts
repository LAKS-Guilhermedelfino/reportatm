"use server";

import { createClient } from "@/lib/supabase/server";
import { requestPasswordResetSchema } from "@/lib/validations/auth";

export type RequestResetState = { error?: string; sent?: boolean };

export async function requestPasswordReset(
  _prevState: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // redirectTo aponta direto para /primeiro-acesso (não para /auth/confirm):
  // esse projeto entrega o token pelo fragmento da URL (#access_token=...),
  // que nunca chega ao servidor — só o client-side gate da página consegue
  // processar (ver primeiro-acesso-gate.tsx).
  //
  // Sempre responde como "enviado" mesmo se o e-mail não existir, para não
  // revelar quais e-mails têm conta no sistema.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/primeiro-acesso`,
  });

  return { sent: true };
}
