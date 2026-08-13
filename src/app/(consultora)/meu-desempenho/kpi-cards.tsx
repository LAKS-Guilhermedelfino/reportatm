import { Card, CardContent } from "@/components/ui/card";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import {
  averageTicketCents,
  followupTotalDone,
  type DailyReportCounts,
} from "@/lib/metrics/rates";
import type { FillRate } from "@/lib/metrics/period-aggregation";

export function KpiCards({
  totals,
  fillRate,
}: {
  totals: DailyReportCounts;
  fillRate: FillRate;
}) {
  const ticket = averageTicketCents(totals);

  const items = [
    { label: "Vendas fechadas", value: String(totals.sales_closed) },
    { label: "Valor vendido", value: formatBRLCents(totals.sales_amount_cents) },
    { label: "Ticket médio", value: ticket === null ? "—" : formatBRLCents(ticket) },
    { label: "Ligações realizadas", value: String(totals.calls_made) },
    { label: "Reuniões realizadas", value: String(totals.meetings_held) },
    { label: "Follow-ups feitos", value: String(followupTotalDone(totals)) },
    {
      label: "Taxa de preenchimento",
      value: formatPercent(fillRate.rate),
      hint: `${fillRate.filledBusinessDays}/${fillRate.totalBusinessDays} dias úteis`,
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
