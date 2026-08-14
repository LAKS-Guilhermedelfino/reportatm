import { createClient } from "@/lib/supabase/server";
import { todaySP } from "@/lib/dates/sao-paulo";
import { adjacentPeriod, getPeriod } from "@/lib/dates/periods";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { PeriodNav, type PeriodTab } from "@/components/period-nav";
import { GoalsGrid, type GoalGridRow } from "./goals-grid";
import type { GoalPeriodType } from "@/lib/supabase/types";

const TABS: PeriodTab[] = [
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

      <PeriodNav
        basePath="/metas"
        tabs={TABS}
        type={type}
        period={period}
        referenceDate={referenceDate}
        prevHref={prevHref}
        nextHref={nextHref}
      />

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
