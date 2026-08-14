import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format/currency";
import {
  callAnswerRate,
  callToMeetingRate,
  meetingAttendanceRate,
  meetingToProposalRate,
  proposalToSaleRate,
  type DailyReportCounts,
} from "@/lib/metrics/rates";
import type { ConsultantTeamData } from "@/lib/dashboard/team-data";

const STAGES: {
  label: string;
  rate: (t: DailyReportCounts) => number | null;
}[] = [
  { label: "Atendimento de ligação", rate: callAnswerRate },
  { label: "Ligação → reunião", rate: callToMeetingRate },
  { label: "Comparecimento", rate: meetingAttendanceRate },
  { label: "Reunião → proposta", rate: meetingToProposalRate },
  { label: "Proposta → venda", rate: proposalToSaleRate },
];

/** Média do time por etapa + variação entre a melhor e a pior consultora. */
export function TeamFunnel({ consultants }: { consultants: ConsultantTeamData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Funil do time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {STAGES.map((stage) => {
          const values = consultants
            .map((c) => stage.rate(c.totals))
            .filter((v): v is number => v !== null);

          if (values.length === 0) {
            return (
              <div key={stage.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="text-neutral">—</span>
              </div>
            );
          }

          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);

          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="heading text-foreground">{formatPercent(avg)}</span>
              </div>
              <div className="h-2 rounded-sm bg-surface-3">
                <div
                  className="h-2 rounded-sm bg-primary"
                  style={{ width: `${Math.min(100, avg * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                pior {formatPercent(min)} · melhor {formatPercent(max)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
