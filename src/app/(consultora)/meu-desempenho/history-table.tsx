import { CheckCircle2, Clock, MinusCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateLongPtBR } from "@/lib/dates/sao-paulo";
import { isBusinessDay } from "@/lib/dates/business-days";
import { formatBRLCents } from "@/lib/format/currency";

export type HistoryReport = {
  calls_made: number;
  sales_closed: number;
  sales_amount_cents: number;
  late: boolean;
};

export type HistoryRow = { date: string; report: HistoryReport | null };

export function buildHistoryRows(
  days: string[],
  reportsByDate: Map<string, HistoryReport>,
): HistoryRow[] {
  return days.map((date) => ({ date, report: reportsByDate.get(date) ?? null }));
}

export function HistoryTableView({
  rows,
  weekdayMask,
  holidays,
}: {
  rows: HistoryRow[];
  weekdayMask: number;
  holidays: readonly string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Histórico do período</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {rows.map(({ date, report }) => {
            const businessDay = isBusinessDay(date, weekdayMask, holidays);
            return (
              <div
                key={date}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
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
      </CardContent>
    </Card>
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
