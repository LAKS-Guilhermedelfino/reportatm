"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteConsultant, type InviteConsultantState } from "@/lib/actions/invite-consultant";

const initialState: InviteConsultantState = {};

export function InviteForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    inviteConsultant,
    initialState,
  );

  if (state.success && open) {
    setOpen(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Nova consultora
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="fullName">Nome</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="startedAt">Início</Label>
          <Input id="startedAt" name="startedAt" type="date" />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Convidando…" : "Enviar convite"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
