"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "@/components/forms/number-stepper";
import { CurrencyInput } from "@/components/forms/currency-input";
import {
  dailyReportDefaults,
  type DailyReportInput,
} from "@/lib/validations/daily-report";
import { adminUpdateDailyReport } from "@/lib/actions/admin-daily-report";

const FIELDS: { key: keyof Omit<DailyReportInput, "reportDate" | "notes">; label: string }[] = [
  { key: "newLeadsReceived", label: "Leads novos recebidos" },
  { key: "newLeadsContacted", label: "Contatos com leads novos" },
  { key: "oldLeadsContacted", label: "Leads antigos contatados" },
  { key: "oldLeadsReplied", label: "Leads antigos que responderam" },
  { key: "followupColdDone", label: "Frios feitos" },
  { key: "followupColdReplied", label: "Frios que responderam" },
  { key: "followupWarmDone", label: "Mornos feitos" },
  { key: "followupWarmReplied", label: "Mornos que responderam" },
  { key: "followupHotDone", label: "Quentes feitos" },
  { key: "followupHotReplied", label: "Quentes que responderam" },
  { key: "callsMade", label: "Ligações realizadas" },
  { key: "callsAnswered", label: "Ligações atendidas" },
  { key: "meetingsScheduled", label: "Reuniões agendadas" },
  { key: "meetingsHeld", label: "Reuniões realizadas" },
  { key: "quotesSent", label: "Cotações enviadas" },
  { key: "negotiationsOpen", label: "Negociação em andamento" },
  { key: "proposalsSubmitted", label: "Propostas lançadas" },
  { key: "salesClosed", label: "Vendas fechadas" },
];

export function AdminReportForm({
  consultantId,
  reportDate,
  defaultValues,
}: {
  consultantId: string;
  reportDate: string;
  defaultValues?: DailyReportInput;
}) {
  const router = useRouter();
  const [values, setValues] = useState<DailyReportInput>(
    defaultValues ?? { reportDate, ...dailyReportDefaults },
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof DailyReportInput>(key: K, value: DailyReportInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("consultantId", consultantId);
      for (const [key, value] of Object.entries(values)) {
        fd.set(key, String(value ?? ""));
      }
      const result = await adminUpdateDailyReport({}, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/consultoras/${consultantId}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">
            Editar report — {reportDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {FIELDS.map((field) => (
            <NumberStepper
              key={field.key}
              id={field.key}
              name={field.key}
              label={field.label}
              value={values[field.key] as number}
              onChange={(v) => set(field.key, v)}
            />
          ))}
          <CurrencyInput
            id="salesAmountCents"
            name="salesAmountCents"
            label="Valor total vendido"
            valueCents={values.salesAmountCents}
            onChange={(v) => set("salesAmountCents", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Textarea
            placeholder="Observações (opcional)"
            defaultValue={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
