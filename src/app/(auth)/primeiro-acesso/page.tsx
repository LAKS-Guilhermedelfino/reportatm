import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/logo";
import { SetPasswordForm } from "./set-password-form";
import { PrimeiroAcessoGate } from "./primeiro-acesso-gate";

export default async function PrimeiroAcessoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <Logo />

      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="heading text-xl text-foreground">
            Defina sua senha
          </h1>
        </div>

        {user ? (
          <>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <SetPasswordForm />
          </>
        ) : (
          <PrimeiroAcessoGate />
        )}
      </div>
    </div>
  );
}
