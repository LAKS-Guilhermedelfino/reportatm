import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { goalStatus } from "@/lib/metrics/goals";
import { GOAL_STATUS_DISPLAY } from "@/lib/metrics/goal-status-display";
import { formatBRLCents } from "@/lib/format/currency";
import type { ConsultantTeamData } from "@/lib/dashboard/team-data";

/**
 * Tabela-matriz (seção 8.3): consultoras nas linhas, indicadores nas
 * colunas, célula com realizado/meta colorida pelo status — "é aqui que o
 * gestor bate o olho e vê onde está o problema."
 */
export function Matrix({
  consultants,
  businessDaysElapsed,
  businessDaysTotal,
}: {
  consultants: ConsultantTeamData[];
  businessDaysElapsed: number;
  businessDaysTotal: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Matriz da equipe</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left">
                <th className="sticky left-0 bg-surface-2 px-3 py-2 font-medium text-foreground">
                  Consultora
                </th>
                {GOAL_INDICATORS.map((indicator) => (
                  <th
                    key={indicator.key}
                    className="px-3 py-2 text-right font-medium text-muted-foreground"
                  >
                    {indicator.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultants.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 bg-background px-3 py-2 text-foreground">
                    <Link
                      href={`/consultoras/${c.id}`}
                      className="hover:underline"
                    >
                      {c.fullName}
                    </Link>
                  </td>
                  {GOAL_INDICATORS.map((indicator) => {
                    const realizado = indicator.realizado(c.totals);
                    const meta = c.goal ? (c.goal[indicator.key] ?? null) : null;
                    const status = goalStatus(
                      realizado,
                      meta,
                      businessDaysElapsed,
                      businessDaysTotal,
                    );
                    const display = GOAL_STATUS_DISPLAY[status];
                    return (
                      <td
                        key={indicator.key}
                        className={`px-3 py-2 text-right tabular-nums ${display.textClass}`}
                      >
                        {indicator.isMoney ? formatBRLCents(realizado) : realizado}
                        <span className="text-muted-foreground">
                          /{meta === null ? "—" : indicator.isMoney ? formatBRLCents(meta) : meta}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {consultants.length === 0 && (
                <tr>
                  <td
                    colSpan={GOAL_INDICATORS.length + 1}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    Nenhuma consultora ativa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
