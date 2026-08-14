"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateBusinessDays, type SettingsActionState } from "@/lib/actions/settings";

const WEEKDAYS = [
  { bit: 0, label: "Segunda" },
  { bit: 1, label: "Terça" },
  { bit: 2, label: "Quarta" },
  { bit: 3, label: "Quinta" },
  { bit: 4, label: "Sexta" },
  { bit: 5, label: "Sábado" },
  { bit: 6, label: "Domingo" },
];

const initialState: SettingsActionState = {};

export function BusinessDaysForm({ weekdayMask }: { weekdayMask: number }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessDays,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {WEEKDAYS.map((day) => (
          <label key={day.bit} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="weekday"
              value={day.bit}
              defaultChecked={(weekdayMask & (1 << day.bit)) !== 0}
              className="size-4 accent-primary"
            />
            {day.label}
          </label>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando…" : "Salvar dias úteis"}
      </Button>
      {state.success && (
        <span className="ml-2 text-sm text-success">Salvo.</span>
      )}
      {state.error && (
        <span className="ml-2 text-sm text-danger">{state.error}</span>
      )}
    </form>
  );
}
