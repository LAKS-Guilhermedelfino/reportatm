"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addHoliday,
  deleteHoliday,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { formatDateLongPtBR } from "@/lib/dates/sao-paulo";

export type Holiday = { id: string; date: string; description: string | null };

const initialState: SettingsActionState = {};

export function HolidaysManager({ holidays }: { holidays: Holiday[] }) {
  const [addState, addAction, adding] = useActionState(addHoliday, initialState);

  return (
    <div className="space-y-3">
      <form action={addAction} className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="date">Data</Label>
          <Input id="date" name="date" type="date" required className="w-40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            name="description"
            placeholder="Opcional"
            className="w-56"
          />
        </div>
        <Button type="submit" size="sm" disabled={adding}>
          {adding ? "Adicionando…" : "Adicionar feriado"}
        </Button>
      </form>
      {addState.error && (
        <p role="alert" className="text-sm text-danger">
          {addState.error}
        </p>
      )}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {holidays.map((h) => (
          <HolidayRow key={h.id} holiday={h} />
        ))}
        {holidays.length === 0 && (
          <li className="px-3 py-4 text-sm text-muted-foreground">
            Nenhum feriado cadastrado.
          </li>
        )}
      </ul>
    </div>
  );
}

function HolidayRow({ holiday }: { holiday: Holiday }) {
  const [, deleteAction, deleting] = useActionState(deleteHoliday, initialState);

  return (
    <li className="flex items-center justify-between px-3 py-2 text-sm">
      <span className="text-foreground">
        {formatDateLongPtBR(holiday.date)}
        {holiday.description && (
          <span className="text-muted-foreground"> — {holiday.description}</span>
        )}
      </span>
      <form action={deleteAction}>
        <input type="hidden" name="holidayId" value={holiday.id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={deleting}
          aria-label="Remover feriado"
        >
          <Trash2 className="size-4 text-danger" />
        </Button>
      </form>
    </li>
  );
}
