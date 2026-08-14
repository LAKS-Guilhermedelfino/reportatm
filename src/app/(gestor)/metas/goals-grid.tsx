"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { formatBRLCents } from "@/lib/format/currency";
import {
  saveGoals,
  applyDefaultGoalToAll,
  copyGoalsFromPreviousPeriod,
  type GoalsActionState,
} from "@/lib/actions/goals";
import type { PeriodType } from "@/lib/dates/periods";

export type GoalGridRow = {
  id: string; // "default" ou o uuid da consultora
  label: string;
  values: Record<string, number | null>;
  hasGoal: boolean;
};

const initialState: GoalsActionState = {};

function CurrencyCell({
  name,
  defaultCents,
}: {
  name: string;
  defaultCents: number | null;
}) {
  const [display, setDisplay] = useState(
    defaultCents === null ? "" : formatBRLCents(defaultCents),
  );
  const [cents, setCents] = useState<number | null>(defaultCents);

  return (
    <>
      <input type="hidden" name={name} value={cents === null ? "" : cents} />
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder="—"
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (digits === "") {
            setCents(null);
            setDisplay("");
            return;
          }
          const value = parseInt(digits, 10);
          setCents(value);
          setDisplay(formatBRLCents(value));
        }}
        className="h-8 w-28 rounded-sm border border-input bg-transparent px-2 text-right text-sm tabular-nums"
      />
    </>
  );
}

export function GoalsGrid({
  companyId,
  periodType,
  periodStart,
  periodEnd,
  rows,
}: {
  companyId: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  rows: GoalGridRow[];
}) {
  const [saveState, saveAction, saving] = useActionState(saveGoals, initialState);
  const [applyState, applyAction, applying] = useActionState(
    applyDefaultGoalToAll,
    initialState,
  );
  const [copyState, copyAction, copying] = useActionState(
    copyGoalsFromPreviousPeriod,
    initialState,
  );

  const missingGoal = rows.filter((r) => r.id !== "default" && !r.hasGoal);

  return (
    <div className="space-y-4">
      {missingGoal.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
          Sem meta no período: {missingGoal.map((r) => r.label).join(", ")}.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <form action={applyAction}>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="periodType" value={periodType} />
          <input type="hidden" name="periodStart" value={periodStart} />
          <input type="hidden" name="periodEnd" value={periodEnd} />
          <Button type="submit" variant="outline" size="sm" disabled={applying}>
            {applying ? "Aplicando…" : "Aplicar meta padrão da empresa a todas"}
          </Button>
        </form>
        <form action={copyAction}>
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="periodType" value={periodType} />
          <input type="hidden" name="periodStart" value={periodStart} />
          <input type="hidden" name="periodEnd" value={periodEnd} />
          <Button type="submit" variant="outline" size="sm" disabled={copying}>
            {copying ? "Copiando…" : "Copiar metas do período anterior"}
          </Button>
        </form>
      </div>

      {(applyState.error || copyState.error) && (
        <p role="alert" className="text-sm text-danger">
          {applyState.error || copyState.error}
        </p>
      )}

      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="companyId" value={companyId} />
        <input type="hidden" name="periodType" value={periodType} />
        <input type="hidden" name="periodStart" value={periodStart} />
        <input type="hidden" name="periodEnd" value={periodEnd} />
        <input type="hidden" name="rowIds" value={rows.map((r) => r.id).join(",")} />

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="sticky left-0 bg-surface-2 px-3 py-2 text-left font-medium text-foreground">
                  Consultora
                </th>
                {GOAL_INDICATORS.map((indicator) => (
                  <th
                    key={indicator.key}
                    className="px-3 py-2 text-right font-medium text-muted-foreground"
                  >
                    {indicator.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 bg-background px-3 py-2 text-foreground">
                    {row.label}
                  </td>
                  {GOAL_INDICATORS.map((indicator) => {
                    const fieldName = `${indicator.key}__${row.id}`;
                    const current = row.values[indicator.key] ?? null;
                    return (
                      <td key={indicator.key} className="px-3 py-2 text-right">
                        {indicator.isMoney ? (
                          <CurrencyCell name={fieldName} defaultCents={current} />
                        ) : (
                          <input
                            type="number"
                            name={fieldName}
                            min={0}
                            defaultValue={current ?? ""}
                            placeholder="—"
                            className="h-8 w-20 rounded-sm border border-input bg-transparent px-2 text-right text-sm tabular-nums"
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {saveState.error && (
          <p role="alert" className="text-sm text-danger">
            {saveState.error}
          </p>
        )}
        {saveState.success && (
          <p className="text-sm text-success">Metas salvas.</p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar metas"}
        </Button>
      </form>
    </div>
  );
}
