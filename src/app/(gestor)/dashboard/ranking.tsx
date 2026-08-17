import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
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

/**
 * Ranking visual (avatar + posição + valor) — tela inicial do gestor. O
 * troféu (única cor de acento no card) marca só a 1ª posição; as demais
 * posições usam um selo neutro, sem cor decorativa por rank (seção 4 do
 * manual de marca não define paleta de posição, e "cor só como acento" é
 * regra — inventar ouro/prata/bronze fugiria disso).
 */
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

        {ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma consultora ativa.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {ranked.map(({ c, value }, index) => {
              const position = index + 1;
              return (
                <Link
                  key={c.id}
                  href={`/consultoras/${c.id}`}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-2 p-3 text-center transition-colors hover:border-primary/40"
                >
                  {position === 1 ? (
                    <Trophy className="size-4 text-primary" aria-label="1º lugar" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{position}º</span>
                  )}
                  <div className="relative">
                    <Avatar fullName={c.fullName} src={c.avatarUrl} size="lg" />
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-background text-[10px] font-medium text-foreground">
                      {position}
                    </span>
                  </div>
                  <p className="truncate text-xs font-medium text-foreground">
                    {c.fullName}
                  </p>
                  <p className="heading text-sm text-foreground">
                    {formatRankValue(selected, value)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { RankKey };
