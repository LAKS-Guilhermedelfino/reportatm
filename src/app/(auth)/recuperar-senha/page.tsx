import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ResetRequestForm } from "./reset-request-form";

export default function RecuperarSenhaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <Logo />

      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="heading text-xl text-foreground">
            Recuperar senha
          </h1>
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos um link para você definir uma
            nova senha.
          </p>
        </div>

        <ResetRequestForm />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
