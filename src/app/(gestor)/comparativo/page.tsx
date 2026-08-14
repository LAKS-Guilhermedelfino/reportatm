import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import {
  adjacentPeriod,
  getPeriod,
  type Period,
  type PeriodType,
} from "@/lib/dates/periods";
import { loadTeamData } from "@/lib/dashboard/team-data";
import { PeriodNav, type PeriodTab } from "@/components/period-nav";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { formatBRLCents } from "@/lib/format/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsultantPicker } from "./consultant-picker";
import { ComparisonChart } from "./comparison-chart";

const VALID_TYPES: PeriodType[] = ["weekly", "biweekly", "monthly", "custom"];
const TABS: PeriodTab[] = [
  { type: "weekly", label: "Semana" },
  { type: "biweekly", label: "Quinzena" },
  { type: "monthly", label: "Mês" },
];

export default async function ComparativoPage({
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
  const custom: Period | undefined =
    type === "custom" && sp.start && sp.end
      ? { start: sp.start, end: sp.end }
      : undefined;
  const period = getPeriod(type, referenceDate, custom ?? { start: today, end: today });

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

  const teamData = await loadTeamData(supabase, companyId, type, period);

  const selectedIds = (sp.ids ?? "").split(",").filter(Boolean);
  const selected =
    selectedIds.length > 0
      ? teamData.consultants.filter((c) => selectedIds.includes(c.id))
      : teamData.consultants.slice(0, Math.min(3, teamData.consultants.length));

  const prevHref = `/comparativo?period=${type}&date=${adjacentPeriod(type, period, "prev").start}&ids=${selectedIds.join(",")}`;
  const nextHref = `/comparativo?period=${type}&date=${adjacentPeriod(type, period, "next").start}&ids=${selectedIds.join(",")}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Comparativo</h1>
        <p className="text-sm text-muted-foreground">
          Compare de 2 a N consultoras no mesmo período (seção 8.3).
        </p>
      </header>

      <PeriodNav
        basePath="/comparativo"
        tabs={TABS}
        type={type}
        period={period}
        referenceDate={referenceDate}
        prevHref={prevHref}
        nextHref={nextHref}
        allowCustom
      />

      <ConsultantPicker
        consultants={teamData.consultants.map((c) => ({ id: c.id, fullName: c.fullName }))}
        selectedIds={selected.map((c) => c.id)}
        period={type}
        date={referenceDate}
      />

      {selected.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Selecione pelo menos 2 consultoras para comparar.
        </p>
      ) : (
        <>
          <ComparisonChart consultants={selected} />

          <Card>
            <CardHeader>
              <CardTitle className="heading text-base">Tabela</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-left">
                      <th className="sticky left-0 bg-surface-2 px-3 py-2 font-medium text-foreground">
                        Indicador
                      </th>
                      {selected.map((c) => (
                        <th
                          key={c.id}
                          className="px-3 py-2 text-right font-medium text-muted-foreground"
                        >
                          {c.fullName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GOAL_INDICATORS.map((indicator) => (
                      <tr key={indicator.key} className="border-b border-border last:border-0">
                        <td className="sticky left-0 bg-background px-3 py-2 text-foreground">
                          {indicator.label}
                        </td>
                        {selected.map((c) => {
                          const value = indicator.realizado(c.totals);
                          return (
                            <td key={c.id} className="px-3 py-2 text-right tabular-nums text-foreground">
                              {indicator.isMoney ? formatBRLCents(value) : value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
