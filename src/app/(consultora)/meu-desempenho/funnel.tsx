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

/**
 * Funil comercial (seção 7.3): ligação → atendida → reunião agendada →
 * realizada → proposta → venda. Um único hue sequencial (laranja da marca)
 * com opacidade decrescente — magnitude, não categorias, então não precisa
 * de paleta categórica nova (ver skill de dataviz).
 */
export function Funnel({ totals }: { totals: DailyReportCounts }) {
  const stages = [
    { label: "Ligações realizadas", value: totals.calls_made, rate: null as number | null },
    { label: "Ligações atendidas", value: totals.calls_answered, rate: callAnswerRate(totals) },
    { label: "Reuniões agendadas", value: totals.meetings_scheduled, rate: callToMeetingRate(totals) },
    { label: "Reuniões realizadas", value: totals.meetings_held, rate: meetingAttendanceRate(totals) },
    { label: "Propostas lançadas", value: totals.proposals_submitted, rate: meetingToProposalRate(totals) },
    { label: "Vendas fechadas", value: totals.sales_closed, rate: proposalToSaleRate(totals) },
  ];

  const maxValue = Math.max(1, ...stages.map((s) => s.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Funil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => {
          const widthPct = Math.max(6, (stage.value / maxValue) * 100);
          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{stage.label}</span>
                <span className="flex items-baseline gap-2">
                  <span className="heading text-foreground">{stage.value}</span>
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(stage.rate)}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-3 rounded-sm bg-surface-3">
                <div
                  className="h-3 rounded-sm bg-primary"
                  style={{
                    width: `${widthPct}%`,
                    opacity: 1 - index * 0.12,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
