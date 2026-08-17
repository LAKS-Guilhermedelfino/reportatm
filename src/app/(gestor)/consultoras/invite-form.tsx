"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteConsultant, type InviteConsultantState } from "@/lib/actions/invite-consultant";
import { generatePassword } from "@/lib/generate-password";

const initialState: InviteConsultantState = {};

export function InviteForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, formAction, isPending] = useActionState(
    inviteConsultant,
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
        Nova consultora
      </Button>
    );
  }

  if (state.success && state.createdEmail && state.createdPassword) {
    const credentials = `E-mail: ${state.createdEmail}\nSenha: ${state.createdPassword}\n\nAcesse em ${typeof window !== "undefined" ? window.location.origin : ""} e troque a senha assim que possível.`;
    return (
      <div className="space-y-3 rounded-lg border border-success/40 bg-success/5 p-4">
        <p className="text-sm font-medium text-foreground">
          Consultora cadastrada! Copie e envie essas credenciais pra ela (por WhatsApp, por exemplo) — elas não ficam salvas em nenhum lugar além daqui.
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
        <div className="space-y-1">
          <Label htmlFor="password">Senha</Label>
          <div className="flex gap-2">
            <Input
              id="password"
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
        Sem envio de e-mail — a conta já fica ativa com essa senha. Depois de cadastrar, copie e repasse pra consultora.
      </p>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Cadastrando…" : "Cadastrar consultora"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
