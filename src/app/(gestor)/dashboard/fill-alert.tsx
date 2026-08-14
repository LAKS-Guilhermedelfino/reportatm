import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantTeamData } from "@/lib/dashboard/team-data";

export function FillAlert({
  consultants,
  todayFilledIds,
  showToday,
}: {
  consultants: ConsultantTeamData[];
  todayFilledIds: Set<string>;
  /** false quando hoje não é dia útil ou está fora do período visto. */
  showToday: boolean;
}) {
  const missingToday = showToday
    ? consultants.filter((c) => !todayFilledIds.has(c.id))
    : [];
  const missingInPeriod = consultants.filter(
    (c) => c.fillRate.totalBusinessDays > 0 && c.fillRate.rate !== 1,
  );

  if (missingToday.length === 0 && missingInPeriod.length === 0) return null;

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <AlertTriangle className="text-warning" />
        <CardTitle className="heading text-base">
          Alerta de preenchimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {missingToday.length > 0 && (
          <p>
            <span className="text-foreground">Não preencheram hoje: </span>
            <span className="text-muted-foreground">
              {missingToday.map((c) => c.fullName).join(", ")}
            </span>
          </p>
        )}
        {missingInPeriod.length > 0 && (
          <div>
            <p className="text-foreground">Faltas no período:</p>
            <ul className="mt-1 space-y-0.5 text-muted-foreground">
              {missingInPeriod.map((c) => (
                <li key={c.id}>
                  {c.fullName} — {c.fillRate.filledBusinessDays}/
                  {c.fillRate.totalBusinessDays} dias úteis
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
