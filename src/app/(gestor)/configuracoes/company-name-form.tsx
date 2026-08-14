"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanyName, type SettingsActionState } from "@/lib/actions/settings";

const initialState: SettingsActionState = {};

export function CompanyNameForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(
    updateCompanyName,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="name">Nome da empresa</Label>
        <Input id="name" name="name" defaultValue={name} className="w-64" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      {state.success && <span className="text-sm text-success">Salvo.</span>}
      {state.error && <span className="text-sm text-danger">{state.error}</span>}
    </form>
  );
}
