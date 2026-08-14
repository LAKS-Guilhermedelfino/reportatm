import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRLCents } from "@/lib/format/currency";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import type { DailyReportCounts } from "@/lib/metrics/rates";
import type { ConsultantTeamData } from "@/lib/dashboard/team-data";

/** Comparação lado a lado com a média do time (seção 8.3, /consultoras/[id]). */
export function TeamComparison({
  totals,
  teamConsultants,
}: {
  totals: DailyReportCounts;
  teamConsultants: ConsultantTeamData[];
}) {
  const teamSize = Math.max(1, teamConsultants.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">
          Comparação com a média do time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {GOAL_INDICATORS.map((indicator) => {
          const hers = indicator.realizado(totals);
          const teamAvg =
            teamConsultants.reduce((acc, c) => acc + indicator.realizado(c.totals), 0) /
            teamSize;
          const diff = hers - teamAvg;
          const format = (v: number) =>
            indicator.isMoney ? formatBRLCents(Math.round(v)) : v.toFixed(indicator.isMoney ? 0 : 1);

          return (
            <div
              key={indicator.key}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{indicator.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-foreground">
                  {indicator.isMoney ? formatBRLCents(hers) : hers}
                </span>
                <span className="text-xs text-muted-foreground">
                  time: {format(teamAvg)}
                </span>
                <span
                  className={
                    diff > 0 ? "text-success text-xs" : diff < 0 ? "text-danger text-xs" : "text-neutral text-xs"
                  }
                >
                  {diff > 0 ? "▲" : diff < 0 ? "▼" : "="}
                </span>
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
