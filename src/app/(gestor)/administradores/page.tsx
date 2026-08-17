import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteAdminForm } from "./invite-admin-form";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  gestora: "Gestora",
};

/**
 * Gestão de acesso master (seção 5) — só admin entra aqui, nem gestora.
 * Convite de consultora continua em /consultoras; esta tela é só pra
 * admin/gestora (os dois papéis de "gestão", não o de preenchimento).
 */
export default async function AdministradoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const companyId = profile.company_id;

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, active")
    .eq("company_id", companyId)
    .in("role", ["admin", "gestora"])
    .order("role")
    .order("full_name");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="heading text-2xl text-foreground">Administradores</h1>
          <p className="text-sm text-muted-foreground">
            Quem tem acesso master (admin) ou de gestão (gestora) da sua empresa.
          </p>
        </div>
        <InviteAdminForm companyId={companyId} />
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Papel</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-foreground">
                  {u.full_name}
                  {u.id === user.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2 text-foreground">{ROLE_LABEL[u.role] ?? u.role}</td>
                <td className="px-3 py-2 text-foreground">{u.active ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum administrador ou gestora cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
