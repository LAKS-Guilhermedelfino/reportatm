"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatBRLCents } from "@/lib/format/currency";
import type { ReportSummary } from "@/lib/actions/daily-report";

const ROWS: { key: keyof ReportSummary; label: string; money?: boolean }[] = [
  { key: "callsMade", label: "Ligações realizadas" },
  { key: "followupTotal", label: "Follow-ups feitos" },
  { key: "meetingsHeld", label: "Reuniões realizadas" },
  { key: "salesClosed", label: "Vendas fechadas" },
  { key: "salesAmountCents", label: "Valor vendido", money: true },
];

export function ConfirmationPanel({
  today,
  weekAverage,
  onEditAgain,
}: {
  today?: ReportSummary;
  weekAverage?: ReportSummary;
  onEditAgain: () => void;
}) {
  return (
    <Card className="border-success/40 bg-success/5">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <CheckCircle2 className="text-success" />
        <CardTitle className="heading text-base">Report enviado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {today && (
          <div className="space-y-2">
            {ROWS.map(({ key, label, money }) => {
              const value = today[key];
              const avg = weekAverage?.[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground">
                    <span className="font-medium">
                      {money ? formatBRLCents(value) : value}
                    </span>
                    {avg !== undefined && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        média 7d: {money ? formatBRLCents(avg) : avg.toFixed(1)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onEditAgain}>
          Continuar editando
        </Button>
      </CardContent>
    </Card>
  );
}
