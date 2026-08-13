import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Alvo dos links de e-mail do Supabase Auth (convite e recuperação de
 * senha). Aceita os dois formatos que o GoTrue pode gerar dependendo da
 * configuração do projeto: token_hash+type (fluxo clássico de OTP) ou code
 * (PKCE). Precisa estar em PUBLIC_PATHS no middleware — é literalmente a
 * rota que estabelece a sessão, então não pode exigir sessão pra entrar.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/primeiro-acesso";

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?erro=link_invalido");
}
