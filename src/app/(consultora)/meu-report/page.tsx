import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateLongPtBR, todaySP } from "@/lib/dates/sao-paulo";
import { getReportPageData } from "./get-report-page-data";
import { DailyReportForm } from "./daily-report-form";

export default async function MeuReportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id")
    .eq("id", user.id)
    .single();

  const today = todaySP();
  const { defaultValues, openDays, alreadyFilled } = await getReportPageData(
    supabase,
    user.id,
    profile?.company_id ?? "",
    today,
    today,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <p className="text-sm capitalize text-muted-foreground">
          {formatDateLongPtBR(today)}
        </p>
        <h1 className="heading text-2xl text-foreground">
          {profile?.full_name ?? "Meu report"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {alreadyFilled
            ? "Você já preencheu hoje — pode editar livremente até virar o dia."
            : "Ainda sem preenchimento hoje."}
        </p>
        <Link
          href="/meu-report/historico"
          className="inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver meu histórico
        </Link>
      </header>

      {openDays.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium text-foreground">
            Você tem {openDays.length === 1 ? "um dia" : "dias"} em aberto
          </p>
          <ul className="mt-1 space-y-1 text-muted-foreground">
            {openDays.map((date) => (
              <li key={date}>
                {formatDateLongPtBR(date)} —{" "}
                <Link
                  href={`/meu-report/${date}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  preencher agora
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DailyReportForm reportDate={today} defaultValues={defaultValues} />
    </div>
  );
}
