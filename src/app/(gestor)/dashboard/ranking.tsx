import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format/currency";
import {
  callAnswerRate,
  proposalToSaleRate,
  type DailyReportCounts,
} from "@/lib/metrics/rates";
import type { ConsultantTeamData } from "@/lib/dashboard/team-data";

type RankKey = "calls_made" | "meetings_held" | "sales_closed" | "call_answer_rate" | "proposal_to_sale_rate";

const RANK_OPTIONS: { key: RankKey; label: string }[] = [
  { key: "sales_closed", label: "Vendas" },
  { key: "calls_made", label: "Ligações" },
  { key: "meetings_held", label: "Reuniões" },
  { key: "call_answer_rate", label: "Taxa de atendimento" },
  { key: "proposal_to_sale_rate", label: "Proposta → venda" },
];

export const VALID_RANK_KEYS: RankKey[] = RANK_OPTIONS.map((o) => o.key);

function rankValue(key: RankKey, totals: DailyReportCounts): number | null {
  switch (key) {
    case "calls_made":
      return totals.calls_made;
    case "meetings_held":
      return totals.meetings_held;
    case "sales_closed":
      return totals.sales_closed;
    case "call_answer_rate":
      return callAnswerRate(totals);
    case "proposal_to_sale_rate":
      return proposalToSaleRate(totals);
  }
}

function formatRankValue(key: RankKey, value: number | null): string {
  if (value === null) return "—";
  if (key === "call_answer_rate" || key === "proposal_to_sale_rate") {
    return formatPercent(value);
  }
  return String(value);
}

export function Ranking({
  consultants,
  selected,
  baseQuery,
}: {
  consultants: ConsultantTeamData[];
  selected: RankKey;
  baseQuery: string;
}) {
  const ranked = [...consultants]
    .map((c) => ({ c, value: rankValue(selected, c.totals) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Ranking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {RANK_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={`/dashboard?${baseQuery}&rank=${opt.key}`}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                opt.key === selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <ol className="space-y-1.5">
          {ranked.map(({ c, value }, index) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">
                <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                {c.fullName}
              </span>
              <span className="heading text-foreground">
                {formatRankValue(selected, value)}
              </span>
            </li>
          ))}
          {ranked.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nenhuma consultora ativa.
            </li>
          )}
        </ol>
      </CardContent>
    </Card>
  );
}

export type { RankKey };
