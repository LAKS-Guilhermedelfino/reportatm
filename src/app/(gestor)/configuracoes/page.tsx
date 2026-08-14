import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyNameForm } from "./company-name-form";
import { BusinessDaysForm } from "./business-days-form";
import { HolidaysManager } from "./holidays-manager";

export default async function ConfiguracoesPage() {
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

  const [{ data: company }, { data: businessDays }, { data: holidays }] =
    await Promise.all([
      supabase.from("companies").select("name").eq("id", companyId).single(),
      supabase
        .from("business_days")
        .select("weekday_mask")
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("holidays")
        .select("id, date, description")
        .eq("company_id", companyId)
        .order("date"),
    ]);

  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da empresa, dias úteis e feriados (seção 8.3).
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyNameForm name={company?.name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Dias úteis</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessDaysForm weekdayMask={businessDays?.weekday_mask ?? 31} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Feriados</CardTitle>
        </CardHeader>
        <CardContent>
          <HolidaysManager holidays={holidays ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            O alternador de tema claro/escuro fica no ícone no canto superior
            direito, em qualquer tela.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
