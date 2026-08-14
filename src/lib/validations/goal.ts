import { z } from "zod";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";

/** "" (campo vazio) vira null — nulo significa "sem meta" (seção 6). */
const nullableGoalValue = z
  .union([z.literal(""), z.coerce.number().int().min(0)])
  .transform((v) => (v === "" ? null : v))
  .nullable();

export const goalRowSchema = z.object(
  Object.fromEntries(
    GOAL_INDICATORS.map((indicator) => [indicator.key, nullableGoalValue]),
  ) as Record<(typeof GOAL_INDICATORS)[number]["key"], typeof nullableGoalValue>,
);

export type GoalRowInput = z.infer<typeof goalRowSchema>;

export const periodTypeSchema = z.enum(["daily", "weekly", "biweekly", "monthly"]);
