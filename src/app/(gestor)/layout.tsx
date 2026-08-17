import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";

/**
 * Área do gestor (admin/gestora, seção 5 e 8.3+). Consultora não entra
 * aqui — cada perfil tem sua própria área (ver (consultora)/layout.tsx).
 */
export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "gestora") {
    redirect("/");
  }

  const isAdmin = profile.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl gap-4 px-4 py-2 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/consultoras" className="text-muted-foreground hover:text-foreground">
            Consultoras
          </Link>
          <Link href="/comparativo" className="text-muted-foreground hover:text-foreground">
            Comparativo
          </Link>
          <Link href="/metas" className="text-muted-foreground hover:text-foreground">
            Metas
          </Link>
          <Link href="/relatorios" className="text-muted-foreground hover:text-foreground">
            Relatórios
          </Link>
          <Link
            href="/configuracoes"
            className="text-muted-foreground hover:text-foreground"
          >
            Configurações
          </Link>
          {isAdmin && (
            <Link
              href="/administradores"
              className="text-muted-foreground hover:text-foreground"
            >
              Administradores
            </Link>
          )}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
