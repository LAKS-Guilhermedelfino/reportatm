"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdminUser, type InviteAdminUserState } from "@/lib/actions/invite-admin-user";

const initialState: InviteAdminUserState = {};

export function InviteAdminForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    inviteAdminUser,
    initialState,
  );

  if (state.success && open) {
    setOpen(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Novo administrador
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
          <Label htmlFor="admin-fullName">Nome</Label>
          <Input id="admin-fullName" name="fullName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="admin-email">E-mail</Label>
          <Input id="admin-email" name="email" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="admin-role">Papel</Label>
          <select
            id="admin-role"
            name="role"
            defaultValue="gestora"
            className="h-9 w-full rounded-sm border border-input bg-transparent px-2 text-sm"
          >
            <option value="gestora">Gestora</option>
            <option value="admin">Administrador (acesso master)</option>
          </select>
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
