import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todaySP, formatDateLongPtBR } from "@/lib/dates/sao-paulo";
import { adjacentPeriod, getPeriod } from "@/lib/dates/periods";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { cn } from "@/lib/utils";
import { GoalsGrid, type GoalGridRow } from "./goals-grid";
import type { GoalPeriodType } from "@/lib/supabase/types";

const TABS: { type: GoalPeriodType; label: string }[] = [
  { type: "weekly", label: "Semanal" },
  { type: "biweekly", label: "Quinzenal" },
  { type: "monthly", label: "Mensal" },
];

const VALID_GOAL_PERIOD_TYPES: GoalPeriodType[] = [
  "weekly",
  "biweekly",
  "monthly",
  "daily",
];

function isGoalPeriodType(value: string | undefined): value is GoalPeriodType {
  return VALID_GOAL_PERIOD_TYPES.includes(value as GoalPeriodType);
}

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const today = todaySP();
  const type: GoalPeriodType = isGoalPeriodType(sp.period) ? sp.period : "monthly";
  const referenceDate = sp.date ?? today;
  const period = getPeriod(type, referenceDate);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  const companyId = profile?.company_id ?? "";

  const [{ data: consultants }, { data: goals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId)
      .eq("role", "consultora")
      .eq("active", true)
      .order("full_name"),
    supabase
      .from("goals")
      .select(["id", "consultant_id", ...GOAL_INDICATORS.map((i) => i.key)].join(","))
      .eq("company_id", companyId)
      .eq("period_type", type)
      .eq("period_start", period.start)
      .eq("period_end", period.end),
  ]);

  const goalsByConsultant = new Map(
    (goals ?? []).map((g) => [
      (g as unknown as { consultant_id: string | null }).consultant_id ??
        "default",
      g as unknown as Record<string, number | null>,
    ]),
  );

  const rows: GoalGridRow[] = [
    {
      id: "default",
      label: "Meta padrão da empresa",
      values: goalsByConsultant.get("default") ?? {},
      hasGoal: goalsByConsultant.has("default"),
    },
    ...(consultants ?? []).map((c) => ({
      id: c.id,
      label: c.full_name,
      values: goalsByConsultant.get(c.id) ?? {},
      hasGoal: goalsByConsultant.has(c.id),
    })),
  ];

  const prevHref = `/metas?period=${type}&date=${adjacentPeriod(type, period, "prev").start}`;
  const nextHref = `/metas?period=${type}&date=${adjacentPeriod(type, period, "next").start}`;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="heading text-2xl text-foreground">Metas</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro manual das metas por consultora e da empresa (seção 8.3).
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.type}
              href={`/metas?period=${tab.type}&date=${referenceDate}`}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                tab.type === type
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex w-full justify-between sm:contents">
            <Link href={prevHref} className="hover:text-foreground">
              ‹ Anterior
            </Link>
            <span className="hidden text-foreground sm:inline">
              {formatDateLongPtBR(period.start)} — {formatDateLongPtBR(period.end)}
            </span>
            <Link href={nextHref} className="hover:text-foreground">
              Seguinte ›
            </Link>
          </div>
          <span className="text-center text-foreground sm:hidden">
            {formatDateLongPtBR(period.start)} — {formatDateLongPtBR(period.end)}
          </span>
        </div>
      </div>

      <GoalsGrid
        companyId={companyId}
        periodType={type}
        periodStart={period.start}
        periodEnd={period.end}
        rows={rows}
      />
    </div>
  );
}
