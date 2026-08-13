import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";

/**
 * Área exclusiva da consultora (seção 8.2). Admin/gestora têm suas próprias
 * telas a partir da Fase 6 — aqui só quem tem role 'consultora' entra.
 */
export default async function ConsultoraLayout({
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

  if (profile?.role !== "consultora") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
