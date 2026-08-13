import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateLongPtBR, subDaysISO, todaySP } from "@/lib/dates/sao-paulo";
import { isBusinessDay } from "@/lib/dates/business-days";
import { formatBRLCents } from "@/lib/format/currency";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, MinusCircle, XCircle } from "lucide-react";

const DAYS_BACK = 14;

export default async function HistoricoPage() {
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

  const today = todaySP();
  const start = subDaysISO(today, DAYS_BACK - 1);

  const [{ data: reports }, { data: businessDays }, { data: holidays }] =
    await Promise.all([
      supabase
        .from("daily_reports")
        .select("report_date, late, calls_made, sales_closed, sales_amount_cents")
        .eq("consultant_id", user.id)
        .gte("report_date", start)
        .lte("report_date", today),
      supabase
        .from("business_days")
        .select("weekday_mask")
        .eq("company_id", profile?.company_id ?? "")
        .maybeSingle(),
      supabase
        .from("holidays")
        .select("date")
        .eq("company_id", profile?.company_id ?? "")
        .gte("date", start)
        .lte("date", today),
    ]);

  const byDate = new Map((reports ?? []).map((r) => [r.report_date, r]));
  const holidayDates = (holidays ?? []).map((h) => h.date);
  const weekdayMask = businessDays?.weekday_mask ?? 31;

  const days: string[] = [];
  for (let i = 0; i < DAYS_BACK; i++) {
    days.push(subDaysISO(today, i));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <Link
          href="/meu-report"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Voltar para o report de hoje
        </Link>
        <h1 className="heading text-2xl text-foreground">
          Meu histórico
        </h1>
        <p className="text-sm text-muted-foreground">
          Últimos {DAYS_BACK} dias. Dias sem preenchimento aparecem como
          lacuna, não como zero.
        </p>
      </header>

      <div className="divide-y divide-border rounded-lg border border-border">
        {days.map((date) => {
          const report = byDate.get(date);
          const businessDay = isBusinessDay(date, weekdayMask, holidayDates);

          return (
            <div
              key={date}
              className="flex items-center justify-between gap-3 p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-foreground">
                  {formatDateLongPtBR(date)}
                </p>
                {report && (
                  <p className="text-xs text-muted-foreground">
                    {report.calls_made} ligações ·{" "}
                    {report.sales_closed > 0
                      ? `${report.sales_closed} venda(s) · ${formatBRLCents(report.sales_amount_cents)}`
                      : "sem venda"}
                  </p>
                )}
              </div>

              <StatusBadge
                filled={Boolean(report)}
                late={report?.late ?? false}
                businessDay={businessDay}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({
  filled,
  late,
  businessDay,
}: {
  filled: boolean;
  late: boolean;
  businessDay: boolean;
}) {
  if (!businessDay) {
    return (
      <Badge variant="secondary" className="gap-1 text-neutral">
        <MinusCircle className="size-3" />
        Não útil
      </Badge>
    );
  }

  if (filled && late) {
    return (
      <Badge variant="secondary" className="gap-1 text-warning">
        <Clock className="size-3" />
        Atrasado
      </Badge>
    );
  }

  if (filled) {
    return (
      <Badge variant="secondary" className="gap-1 text-success">
        <CheckCircle2 className="size-3" />
        Preenchido
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 text-danger">
      <XCircle className="size-3" />
      Faltando
    </Badge>
  );
}
