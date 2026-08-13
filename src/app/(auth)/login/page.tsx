import Link from "next/link";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <Logo />

      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card p-6">
        <div className="space-y-1">
          <h1 className="heading text-xl text-foreground">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Acesse com o e-mail e a senha cadastrados pela sua empresa.
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/recuperar-senha"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </div>
  );
}
