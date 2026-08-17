"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdminUser, type InviteAdminUserState } from "@/lib/actions/invite-admin-user";

const initialState: InviteAdminUserState = {};

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function InviteAdminForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(
    inviteAdminUser,
    initialState,
  );

  function reset() {
    setOpen(false);
    setPassword("");
    setCopied(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        Novo administrador
      </Button>
    );
  }

  if (state.success && state.createdEmail && state.createdPassword) {
    const credentials = `E-mail: ${state.createdEmail}\nSenha: ${state.createdPassword}\n\nAcesse em ${typeof window !== "undefined" ? window.location.origin : ""} e troque a senha assim que possível.`;
    return (
      <div className="space-y-3 rounded-lg border border-success/40 bg-success/5 p-4">
        <p className="text-sm font-medium text-foreground">
          Usuário criado! Copie e envie essas credenciais pra pessoa (por WhatsApp, por exemplo) — elas não ficam salvas em nenhum lugar além daqui.
        </p>
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface-2 p-3 text-xs text-foreground">
          {credentials}
        </pre>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(credentials);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copiado!" : "Copiar credenciais"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Concluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <input type="hidden" name="companyId" value={companyId} />
      <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="space-y-1">
          <Label htmlFor="admin-password">Senha</Label>
          <div className="flex gap-2">
            <Input
              id="admin-password"
              name="password"
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mín. 8 caracteres"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPassword(generatePassword())}
            >
              Gerar
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Sem envio de e-mail — a conta já fica ativa com essa senha. Depois de criar, copie e repasse pra pessoa.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Criando…" : "Criar usuário"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
