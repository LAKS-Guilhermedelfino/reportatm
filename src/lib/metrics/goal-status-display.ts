import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { GoalStatus } from "./goals";

export const GOAL_STATUS_DISPLAY: Record<
  GoalStatus,
  { label: string; textClass: string; icon: LucideIcon }
> = {
  atingido: { label: "Atingido", textClass: "text-success", icon: CheckCircle2 },
  "no-ritmo": { label: "No ritmo", textClass: "text-success/80", icon: TrendingUp },
  "em-risco": { label: "Em risco", textClass: "text-warning", icon: AlertTriangle },
  "fora-da-meta": { label: "Fora da meta", textClass: "text-danger", icon: XCircle },
  "sem-meta": { label: "Sem meta", textClass: "text-neutral", icon: MinusCircle },
};
