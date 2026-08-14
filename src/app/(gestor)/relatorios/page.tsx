import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import { adjacentPeriod, getPeriod, type PeriodType } from "@/lib/dates/periods";
import { PeriodNav, type PeriodTab } from "@/components/period-nav";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { goalAttainment, goalStatus } from "@/lib/metrics/goals";
import { GOAL_STATUS_DISPLAY } from "@/lib/metrics/goal-status-display";
import { FindingsList } from "@/components/diagnostics/findings-list";
import { ReportSelector } from "./report-selector";
import { WhatsAppCopyBox } from "./whatsapp-copy-box";
import {
  loadIndividualReportData,
  loadTeamReportData,
} from "@/lib/reports/load-report-data";
import { buildIndividualWhatsAppText, buildTeamWhatsAppText } from "@/lib/reports/whatsapp-text";
import { countBusinessDays } from "@/lib/dates/periods";

/** /relatorios só oferece semanal, quinzenal e mensal (seção 8.3). */
const VALID_TYPES: PeriodType[] = ["weekly", "biweekly", "monthly"];
const TABS: PeriodTab[] = [
  { type: "weekly", label: "Semana" },
  { type: "biweekly", label: "Quinzena" },
  { type: "monthly", label: "Mês" },
];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const today = todaySP();

  const type: PeriodType = VALID_TYPES.includes(sp.period as PeriodType)
    ? (sp.period as PeriodType)
    : "weekly";
  const referenceDate = sp.date ?? today;
  const period = getPeriod(type, referenceDate);
  const scope: "individual" | "time" = sp.scope === "individual" ? "individual" : "time";

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

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();
  const companyName = company?.name ?? "";

  const { data: consultantRows } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", companyId)
    .eq("role", "consultora")
    .eq("active", true)
    .order("full_name");
  const consultants = (consultantRows ?? []).map((c) => ({ id: c.id, fullName: c.full_name }));

  const consultantId =
    scope === "individual"
      ? (sp.consultantId && consultants.some((c) => c.id === sp.consultantId)
          ? sp.consultantId
          : consultants[0]?.id ?? null)
      : null;

  const baseQuery = `scope=${scope}${consultantId ? `&consultantId=${consultantId}` : ""}`;
  const prevHref = `/relatorios?period=${type}&date=${adjacentPeriod(type, period, "prev").start}&${baseQuery}`;
  const nextHref = `/relatorios?period=${type}&date=${adjacentPeriod(type, period, "next").start}&${baseQuery}`;

  const { data: businessDaysRow } = await supabase
    .from("business_days")
    .select("weekday_mask")
    .eq("company_id", companyId)
    .maybeSingle();
  const { data: holidaysRows } = await supabase
    .from("holidays")
    .select("date")
    .eq("company_id", companyId)
    .gte("date", period.start)
    .lte("date", period.end);
  const weekdayMask = businessDaysRow?.weekday_mask ?? 31;
  const holidayDates = (holidaysRows ?? []).map((h) => h.date);
  const businessDaysTotal = countBusinessDays(period.start, period.end, weekdayMask, holidayDates);
  const elapsedEnd = period.end < today ? period.end : today;
  const businessDaysElapsed =
    elapsedEnd < period.start ? 0 : countBusinessDays(period.start, elapsedEnd, weekdayMask, holidayDates);

  const exportQuery = `scope=${scope}&period=${type}&date=${referenceDate}${
    consultantId ? `&consultantId=${consultantId}` : ""
  }`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Geração e exportação de relatório individual ou de time (seção 8.3).
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodNav
          basePath="/relatorios"
          tabs={TABS}
          type={type}
          period={period}
          referenceDate={referenceDate}
          prevHref={prevHref}
          nextHref={nextHref}
        />
        <ReportSelector consultants={consultants} scope={scope} consultantId={consultantId} />
      </div>

      {scope === "individual" && !consultantId ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma consultora ativa cadastrada ainda.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/relatorios/export/csv?${exportQuery}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Baixar CSV
            </a>
            <a
              href={`/relatorios/export/pdf?${exportQuery}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Baixar PDF
            </a>
          </div>

          {scope === "individual" && consultantId ? (
            <IndividualPreview
              supabase={supabase}
              companyId={companyId}
              companyName={companyName}
              consultantId={consultantId}
              consultantName={consultants.find((c) => c.id === consultantId)?.fullName ?? ""}
              type={type}
              period={period}
              today={today}
              businessDaysElapsed={businessDaysElapsed}
              businessDaysTotal={businessDaysTotal}
            />
          ) : (
            <TeamPreview
              supabase={supabase}
              companyId={companyId}
              companyName={companyName}
              type={type}
              period={period}
              today={today}
            />
          )}
        </>
      )}
    </div>
  );
}

type SupabaseClientArg = Awaited<ReturnType<typeof createClient>>;

async function IndividualPreview({
  supabase,
  companyId,
  companyName,
  consultantId,
  consultantName,
  type,
  period,
  today,
  businessDaysElapsed,
  businessDaysTotal,
}: {
  supabase: SupabaseClientArg;
  companyId: string;
  companyName: string;
  consultantId: string;
  consultantName: string;
  type: PeriodType;
  period: { start: string; end: string };
  today: string;
  businessDaysElapsed: number;
  businessDaysTotal: number;
}) {
  const data = await loadIndividualReportData(
    supabase,
    companyId,
    companyName,
    consultantId,
    consultantName,
    type,
    period,
    today,
  );
  const goalRows = GOAL_INDICATORS.filter((i) => data.goal && data.goal[i.key] !== null);
  const text = buildIndividualWhatsAppText(data, businessDaysElapsed, businessDaysTotal);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">
            {data.consultantName} — {data.periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Kpi label="Vendas fechadas" value={String(data.totals.sales_closed)} />
          <Kpi label="Valor vendido" value={formatBRLCents(data.totals.sales_amount_cents)} />
          <Kpi label="Ligações realizadas" value={String(data.totals.calls_made)} />
          <Kpi label="Reuniões realizadas" value={String(data.totals.meetings_held)} />
          <Kpi label="Propostas lançadas" value={String(data.totals.proposals_submitted)} />
          <Kpi label="Taxa de preenchimento" value={formatPercent(data.fillRate.rate)} />
        </CardContent>
      </Card>

      {goalRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="heading text-base">Metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {goalRows.map((indicator) => {
              const realizado = indicator.realizado(data.totals);
              const meta = data.goal![indicator.key] as number;
              const attainment = goalAttainment(realizado, meta);
              const status = goalStatus(realizado, meta, businessDaysElapsed, businessDaysTotal);
              const realizadoFmt = indicator.isMoney ? formatBRLCents(realizado) : realizado;
              const metaFmt = indicator.isMoney ? formatBRLCents(meta) : meta;
              return (
                <div
                  key={indicator.key}
                  className="flex items-center justify-between border-b border-border py-1.5 text-sm last:border-0"
                >
                  <span className="text-muted-foreground">{indicator.label}</span>
                  <span className="text-foreground">
                    {realizadoFmt}/{metaFmt} ({formatPercent(attainment)} —{" "}
                    {GOAL_STATUS_DISPLAY[status].label})
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <FindingsList findings={data.findings} />

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Texto pra WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsAppCopyBox text={text} />
        </CardContent>
      </Card>
    </div>
  );
}

async function TeamPreview({
  supabase,
  companyId,
  companyName,
  type,
  period,
  today,
}: {
  supabase: SupabaseClientArg;
  companyId: string;
  companyName: string;
  type: PeriodType;
  period: { start: string; end: string };
  today: string;
}) {
  const data = await loadTeamReportData(supabase, companyId, companyName, type, period, today);
  const text = buildTeamWhatsAppText(data);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">{data.periodLabel}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Kpi label="Total vendido" value={formatBRLCents(data.teamTotals.sales_amount_cents)} />
          <Kpi label="Vendas" value={String(data.teamTotals.sales_closed)} />
          <Kpi label="Ligações" value={String(data.teamTotals.calls_made)} />
          <Kpi label="Preenchimento do time" value={formatPercent(data.teamFillRate.rate)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Por consultora</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left">
                  <th className="px-3 py-2 font-medium text-foreground">Consultora</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Ligações</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Vendas</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Valor vendido</th>
                </tr>
              </thead>
              <tbody>
                {data.consultants.map((c) => (
                  <tr key={c.fullName} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-foreground">{c.fullName}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {c.totals.calls_made}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {c.totals.sales_closed}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {formatBRLCents(c.totals.sales_amount_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <FindingsList findings={data.aggregatedFindings} />

      {data.topAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="heading text-base">Quem mais precisa de atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {data.topAttention.map((t) => (
                <li key={t.fullName}>
                  <span className="text-foreground">{t.fullName}</span>
                  <span className="text-muted-foreground"> — {t.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Texto pra WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <WhatsAppCopyBox text={text} />
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="heading text-lg text-foreground">{value}</p>
    </div>
  );
}
