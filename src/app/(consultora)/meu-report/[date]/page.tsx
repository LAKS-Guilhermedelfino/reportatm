import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatDateLongPtBR,
  isWithinConsultantEditWindow,
  todaySP,
} from "@/lib/dates/sao-paulo";
import { getReportPageData } from "../get-report-page-data";
import { DailyReportForm } from "../daily-report-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function MeuReportDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const today = todaySP();

  if (date === today) {
    // Data de hoje é a tela principal — evita duas rotas pro mesmo conteúdo.
    const { redirect } = await import("next/navigation");
    redirect("/meu-report");
  }

  const editable = isWithinConsultantEditWindow(date, today);

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

  if (!editable) {
    return (
      <div className="space-y-4">
        <h1 className="heading text-2xl text-foreground">
          {formatDateLongPtBR(date)}
        </h1>
        <p className="text-sm text-muted-foreground">
          Essa data já saiu da janela de edição (hoje + 2 dias anteriores).
          Se precisar corrigir, fale com sua gestora ou admin.
        </p>
      </div>
    );
  }

  const { defaultValues, alreadyFilled } = await getReportPageData(
    supabase,
    user.id,
    profile?.company_id ?? "",
    date,
    today,
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm capitalize text-muted-foreground">
          {formatDateLongPtBR(date)}
        </p>
        <h1 className="heading text-2xl text-foreground">
          Preenchimento em atraso
        </h1>
        <p className="text-sm text-danger">
          {alreadyFilled
            ? "Editando um dia já preenchido em atraso — fica registrado no histórico de auditoria."
            : "Esse preenchimento vai ficar marcado como atrasado."}
        </p>
      </header>

      <DailyReportForm reportDate={date} defaultValues={defaultValues} />
    </div>
  );
}
