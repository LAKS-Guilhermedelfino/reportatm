"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Seletor de tipo de relatório (individual/time) + consultora (seção 8.3).
 * Preserva período/data já selecionados via PeriodNav.
 */
export function ReportSelector({
  consultants,
  scope,
  consultantId,
}: {
  consultants: { id: string; fullName: string }[];
  scope: "individual" | "time";
  consultantId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setScope(next: "individual" | "time") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", next);
    if (next === "individual" && !params.get("consultantId") && consultants[0]) {
      params.set("consultantId", consultants[0].id);
    }
    router.push(`/relatorios?${params.toString()}`);
  }

  function setConsultant(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", "individual");
    params.set("consultantId", id);
    router.push(`/relatorios?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={scope === "time" ? "default" : "outline"}
        onClick={() => setScope("time")}
      >
        Time
      </Button>
      <Button
        type="button"
        size="sm"
        variant={scope === "individual" ? "default" : "outline"}
        onClick={() => setScope("individual")}
      >
        Individual
      </Button>
      {scope === "individual" && (
        <select
          value={consultantId ?? ""}
          onChange={(e) => setConsultant(e.target.value)}
          className="h-7 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2 text-[0.8rem] text-foreground"
        >
          {consultants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
