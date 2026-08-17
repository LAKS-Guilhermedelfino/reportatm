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

// Altura do bloco do pódio por posição — 1º mais alto, sempre no centro.
const PEDESTAL_HEIGHT: Record<number, string> = { 1: "h-24", 2: "h-16", 3: "h-11" };
const AVATAR_SIZE: Record<number, "lg" | "md"> = { 1: "lg", 2: "md", 3: "md" };
// Ordem visual do pódio: 2º à esquerda, 1º no centro, 3º à direita.
const PODIUM_ORDER = [2, 1, 3];

type RankedEntry = { c: ConsultantTeamData; value: number | null };

function PodiumSlot({
  entry,
  position,
  selected,
}: {
  entry: RankedEntry;
  position: number;
  selected: RankKey;
}) {
  const { c, value } = entry;
  const isFirst = position === 1;

  return (
    <Link
      href={`/consultoras/${c.id}`}
      className="flex flex-1 flex-col items-center gap-2 transition-opacity hover:opacity-80"
    >
      {isFirst && <Trophy className="size-5 text-primary" aria-label="1º lugar" />}
      <Avatar fullName={c.fullName} src={c.avatarUrl} size={AVATAR_SIZE[position]} />
      <p className="w-full truncate text-center text-xs font-medium text-foreground">
        {c.fullName}
      </p>
      <p className="heading text-sm text-foreground">{formatRankValue(selected, value)}</p>
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-lg pt-1.5",
          PEDESTAL_HEIGHT[position],
          isFirst
            ? "border border-primary/40 bg-primary/15"
            : "border border-border bg-surface-2",
        )}
      >
        <span
          className={cn(
            "heading text-lg",
            isFirst ? "text-primary" : "text-muted-foreground",
          )}
        >
          {position}
        </span>
      </div>
    </Link>
  );
}

/**
 * Ranking em estilo pódio (top 3) + lista compacta pro resto — tela
 * inicial do gestor. Cor por posição fica só no 1º lugar (laranja da
 * marca, o acento) — 2º/3º se diferenciam pela altura do bloco, não por
 * cor nova (o manual de marca não define paleta de posição/medalha).
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
  const ranked: RankedEntry[] = [...consultants]
    .map((c) => ({ c, value: rankValue(selected, c.totals) }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Ranking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
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
          <>
            <div className="flex items-end justify-center gap-3 px-2 sm:gap-6">
              {PODIUM_ORDER.filter((position) => podium[position - 1]).map((position) => (
                <PodiumSlot
                  key={podium[position - 1].c.id}
                  entry={podium[position - 1]}
                  position={position}
                  selected={selected}
                />
              ))}
            </div>

            {rest.length > 0 && (
              <ol className="space-y-1.5 border-t border-border pt-3">
                {rest.map(({ c, value }, index) => (
                  <li key={c.id}>
                    <Link
                      href={`/consultoras/${c.id}`}
                      className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-sm transition-colors hover:bg-surface-2"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-foreground">
                        <span className="w-4 shrink-0 text-muted-foreground">{index + 4}º</span>
                        <Avatar fullName={c.fullName} src={c.avatarUrl} size="sm" />
                        <span className="truncate">{c.fullName}</span>
                      </span>
                      <span className="heading shrink-0 text-foreground">
                        {formatRankValue(selected, value)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export type { RankKey };
