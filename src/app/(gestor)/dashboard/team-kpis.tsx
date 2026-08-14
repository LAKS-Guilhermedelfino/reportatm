import { Card, CardContent } from "@/components/ui/card";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { averageTicketCents, type DailyReportCounts } from "@/lib/metrics/rates";
import type { FillRate } from "@/lib/metrics/period-aggregation";

export function TeamKpis({
  totals,
  fillRate,
}: {
  totals: DailyReportCounts;
  fillRate: FillRate;
}) {
  const ticket = averageTicketCents(totals);

  const items = [
    { label: "Total vendido", value: formatBRLCents(totals.sales_amount_cents) },
    { label: "Vendas", value: String(totals.sales_closed) },
    { label: "Ticket médio", value: ticket === null ? "—" : formatBRLCents(ticket) },
    { label: "Propostas", value: String(totals.proposals_submitted) },
    { label: "Reuniões realizadas", value: String(totals.meetings_held) },
    { label: "Ligações", value: String(totals.calls_made) },
    {
      label: "Preenchimento do time",
      value: formatPercent(fillRate.rate),
      hint: `${fillRate.filledBusinessDays}/${fillRate.totalBusinessDays}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 pt-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="heading text-xl text-foreground">{item.value}</p>
            {item.hint && (
              <p className="text-[11px] text-muted-foreground">{item.hint}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
