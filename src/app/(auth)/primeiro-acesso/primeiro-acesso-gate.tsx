"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SetPasswordForm } from "./set-password-form";

type Status = "checking" | "found" | "not-found";

/**
 * Fallback client-side para quando o link de convite/recuperação chega com
 * o token no fragmento da URL (#access_token=...) em vez de query string —
 * fragmento nunca chega ao servidor, então só o client (via
 * detectSessionInUrl, ligado por padrão no browser client) consegue
 * processar e estabelecer a sessão nesse caso.
 */
export function PrimeiroAcessoGate() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? null);
        setStatus("found");
      } else {
        setStatus("not-found");
      }
    });
  }, []);

  if (status === "checking") {
    return (
      <p className="text-sm text-muted-foreground">Verificando link…</p>
    );
  }

  if (status === "not-found") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-danger">
          Este link expirou ou já foi usado. Peça um novo convite ou use
          &quot;esqueci minha senha&quot;.
        </p>
        <Link
          href="/login"
          className="text-sm underline underline-offset-4 hover:text-foreground"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      {email && <p className="text-sm text-muted-foreground">{email}</p>}
      <SetPasswordForm />
    </>
  );
}
