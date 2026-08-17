import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";
import { ConsultantRow } from "./consultant-row";

export default async function ConsultorasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id ?? "";

  const { data: consultants } = await supabase
    .from("profiles")
    .select("id, full_name, email, started_at, active, avatar_url")
    .eq("company_id", companyId)
    .eq("role", "consultora")
    .order("full_name");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="heading text-2xl text-foreground">Consultoras</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro, convite e status das consultoras (seção 8.3).
          </p>
        </div>
        <InviteForm companyId={companyId} />
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Foto</th>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="px-3 py-2 font-medium">Início</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(consultants ?? []).map((c) => (
              <ConsultantRow key={c.id} consultant={c} />
            ))}
            {(consultants ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhuma consultora cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
