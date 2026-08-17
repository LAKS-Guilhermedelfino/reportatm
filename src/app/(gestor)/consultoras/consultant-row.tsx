"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  updateConsultant,
  setConsultantActive,
  type UpdateConsultantState,
} from "@/lib/actions/update-consultant";
import { AvatarUpload } from "./avatar-upload";

export type ConsultantRowData = {
  id: string;
  full_name: string;
  email: string;
  started_at: string | null;
  active: boolean;
  avatar_url: string | null;
};

const initialState: UpdateConsultantState = {};

export function ConsultantRow({ consultant }: { consultant: ConsultantRowData }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updating] = useActionState(
    updateConsultant,
    initialState,
  );
  const [toggleState, toggleAction, toggling] = useActionState(
    setConsultantActive,
    initialState,
  );

  if (updateState.success && editing) {
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-b border-border">
        <td colSpan={6} className="p-3">
          <form action={updateAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="consultantId" value={consultant.id} />
            <Input
              name="fullName"
              defaultValue={consultant.full_name}
              className="w-48"
              required
            />
            <Input
              name="startedAt"
              type="date"
              defaultValue={consultant.started_at ?? ""}
              className="w-40"
            />
            <Button type="submit" size="sm" disabled={updating}>
              {updating ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            {updateState.error && (
              <p role="alert" className="w-full text-sm text-danger">
                {updateState.error}
              </p>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2">
        <AvatarUpload
          consultantId={consultant.id}
          fullName={consultant.full_name}
          avatarUrl={consultant.avatar_url}
        />
      </td>
      <td className="px-3 py-2 text-foreground">{consultant.full_name}</td>
      <td className="px-3 py-2 text-muted-foreground">{consultant.email}</td>
      <td className="px-3 py-2 text-muted-foreground">
        {consultant.started_at ?? "—"}
      </td>
      <td className="px-3 py-2">
        {consultant.active ? (
          <Badge variant="secondary" className="text-success">
            Ativa
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-neutral">
            Inativa
          </Badge>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <form action={toggleAction}>
            <input type="hidden" name="consultantId" value={consultant.id} />
            <input
              type="hidden"
              name="active"
              value={(!consultant.active).toString()}
            />
            <Button type="submit" variant="outline" size="sm" disabled={toggling}>
              {consultant.active ? "Desativar" : "Reativar"}
            </Button>
          </form>
        </div>
        {toggleState.error && (
          <p role="alert" className="text-xs text-danger">
            {toggleState.error}
          </p>
        )}
      </td>
    </tr>
  );
}
