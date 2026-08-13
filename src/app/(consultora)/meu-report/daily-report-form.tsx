"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "@/components/forms/number-stepper";
import { CurrencyInput } from "@/components/forms/currency-input";
import {
  dailyReportDefaults,
  dailyReportSchema,
  type DailyReportInput,
} from "@/lib/validations/daily-report";
import {
  submitDailyReport,
  type SubmitDailyReportState,
} from "@/lib/actions/daily-report";
import {
  followupReplyRate,
  followupTotalDone,
  followupTotalReplied,
  averageTicketCents,
  callAnswerRate,
  meetingAttendanceRate,
  type DailyReportCounts,
} from "@/lib/metrics/rates";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { ConfirmationPanel } from "./confirmation-panel";

const DRAFT_PREFIX = "laks-draft-";

function toCounts(values: DailyReportInput): DailyReportCounts {
  return {
    new_leads_received: values.newLeadsReceived,
    new_leads_contacted: values.newLeadsContacted,
    old_leads_contacted: values.oldLeadsContacted,
    old_leads_replied: values.oldLeadsReplied,
    followup_cold_done: values.followupColdDone,
    followup_cold_replied: values.followupColdReplied,
    followup_warm_done: values.followupWarmDone,
    followup_warm_replied: values.followupWarmReplied,
    followup_hot_done: values.followupHotDone,
    followup_hot_replied: values.followupHotReplied,
    calls_made: values.callsMade,
    calls_answered: values.callsAnswered,
    meetings_scheduled: values.meetingsScheduled,
    meetings_held: values.meetingsHeld,
    quotes_sent: values.quotesSent,
    negotiations_open: values.negotiationsOpen,
    proposals_submitted: values.proposalsSubmitted,
    sales_closed: values.salesClosed,
    sales_amount_cents: values.salesAmountCents,
  };
}

export function DailyReportForm({
  reportDate,
  defaultValues,
}: {
  reportDate: string;
  defaultValues?: DailyReportInput;
}) {
  const draftKey = `${DRAFT_PREFIX}${reportDate}`;
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitDailyReportState | null>(null);
  const hydratedFromDraft = useRef(false);

  const form = useForm<DailyReportInput>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: defaultValues ?? { reportDate, ...dailyReportDefaults },
  });

  // Rascunho local só entra em jogo quando ainda não existe nada salvo no
  // servidor pra essa data — o que já foi enviado é a fonte da verdade.
  useEffect(() => {
    if (defaultValues || hydratedFromDraft.current) return;
    hydratedFromDraft.current = true;
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as DailyReportInput;
      form.reset(draft);
    } catch {
      // rascunho corrompido — ignora silenciosamente
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, defaultValues]);

  const values = form.watch();

  useEffect(() => {
    const timeout = setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(values));
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, JSON.stringify(values)]);

  const counts = useMemo(() => toCounts(values), [values]);

  function onSubmit(data: DailyReportInput) {
    setServerError(null);
    startTransition(async () => {
      const fd = new FormData();
      for (const [key, value] of Object.entries(data)) {
        fd.set(key, String(value ?? ""));
      }
      const state = await submitDailyReport({}, fd);
      if (state.error) {
        setServerError(state.error);
        return;
      }
      window.localStorage.removeItem(draftKey);
      setResult(state);
    });
  }

  if (result?.success) {
    return (
      <ConfirmationPanel
        today={result.today}
        weekAverage={result.weekAverage}
        onEditAgain={() => setResult(null)}
      />
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Leads</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberStepper
            id="newLeadsReceived"
            name="newLeadsReceived"
            label="Leads novos recebidos"
            value={values.newLeadsReceived}
            onChange={(v) => form.setValue("newLeadsReceived", v)}
          />
          <NumberStepper
            id="newLeadsContacted"
            name="newLeadsContacted"
            label="Contatos com leads novos"
            value={values.newLeadsContacted}
            onChange={(v) => form.setValue("newLeadsContacted", v)}
          />
          <NumberStepper
            id="oldLeadsContacted"
            name="oldLeadsContacted"
            label="Leads antigos contatados"
            value={values.oldLeadsContacted}
            onChange={(v) => form.setValue("oldLeadsContacted", v)}
          />
          <NumberStepper
            id="oldLeadsReplied"
            name="oldLeadsReplied"
            label="Leads antigos que responderam"
            value={values.oldLeadsReplied}
            onChange={(v) => form.setValue("oldLeadsReplied", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">
            Follow-ups por temperatura
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Frio</strong>: sem interação
            há mais de 30 dias ou nunca respondeu. {" "}
            <strong className="text-foreground">Morno</strong>: respondeu ou
            interagiu nos últimos 30 dias, sem proposta em aberto. {" "}
            <strong className="text-foreground">Quente</strong>: tem
            cotação/proposta em aberto ou reunião marcada.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <NumberStepper
              id="followupColdDone"
              name="followupColdDone"
              label="Frios feitos"
              value={values.followupColdDone}
              onChange={(v) => form.setValue("followupColdDone", v)}
            />
            <NumberStepper
              id="followupColdReplied"
              name="followupColdReplied"
              label="Frios que responderam"
              value={values.followupColdReplied}
              onChange={(v) => form.setValue("followupColdReplied", v)}
            />
            <NumberStepper
              id="followupWarmDone"
              name="followupWarmDone"
              label="Mornos feitos"
              value={values.followupWarmDone}
              onChange={(v) => form.setValue("followupWarmDone", v)}
            />
            <NumberStepper
              id="followupWarmReplied"
              name="followupWarmReplied"
              label="Mornos que responderam"
              value={values.followupWarmReplied}
              onChange={(v) => form.setValue("followupWarmReplied", v)}
            />
            <NumberStepper
              id="followupHotDone"
              name="followupHotDone"
              label="Quentes feitos"
              value={values.followupHotDone}
              onChange={(v) => form.setValue("followupHotDone", v)}
            />
            <NumberStepper
              id="followupHotReplied"
              name="followupHotReplied"
              label="Quentes que responderam"
              value={values.followupHotReplied}
              onChange={(v) => form.setValue("followupHotReplied", v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Ligações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberStepper
            id="callsMade"
            name="callsMade"
            label="Ligações realizadas"
            value={values.callsMade}
            onChange={(v) => form.setValue("callsMade", v)}
          />
          <NumberStepper
            id="callsAnswered"
            name="callsAnswered"
            label="Ligações atendidas"
            value={values.callsAnswered}
            onChange={(v) => form.setValue("callsAnswered", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Reuniões</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberStepper
            id="meetingsScheduled"
            name="meetingsScheduled"
            label="Reuniões agendadas"
            value={values.meetingsScheduled}
            onChange={(v) => form.setValue("meetingsScheduled", v)}
          />
          <NumberStepper
            id="meetingsHeld"
            name="meetingsHeld"
            label="Reuniões realizadas"
            value={values.meetingsHeld}
            onChange={(v) => form.setValue("meetingsHeld", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Comercial</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NumberStepper
            id="quotesSent"
            name="quotesSent"
            label="Cotações enviadas"
            value={values.quotesSent}
            onChange={(v) => form.setValue("quotesSent", v)}
          />
          <NumberStepper
            id="negotiationsOpen"
            name="negotiationsOpen"
            label="Negociação em andamento"
            value={values.negotiationsOpen}
            onChange={(v) => form.setValue("negotiationsOpen", v)}
          />
          <NumberStepper
            id="proposalsSubmitted"
            name="proposalsSubmitted"
            label="Propostas lançadas no sistema"
            value={values.proposalsSubmitted}
            onChange={(v) => form.setValue("proposalsSubmitted", v)}
          />
          <NumberStepper
            id="salesClosed"
            name="salesClosed"
            label="Vendas fechadas"
            value={values.salesClosed}
            onChange={(v) => form.setValue("salesClosed", v)}
          />
          <CurrencyInput
            id="salesAmountCents"
            name="salesAmountCents"
            label="Valor total vendido"
            valueCents={values.salesAmountCents}
            onChange={(v) => form.setValue("salesAmountCents", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="notes" className="sr-only">
            Observações
          </Label>
          <Textarea
            id="notes"
            {...form.register("notes")}
            placeholder="Opcional"
            rows={3}
          />
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-surface-2">
        <CardHeader>
          <CardTitle className="heading text-base">Ao vivo</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <LiveStat
            label="Follow-ups feitos"
            value={String(followupTotalDone(counts))}
          />
          <LiveStat
            label="Follow-ups respondidos"
            value={String(followupTotalReplied(counts))}
          />
          <LiveStat
            label="Taxa resposta follow-up"
            value={formatPercent(followupReplyRate(counts))}
          />
          <LiveStat
            label="Taxa atendimento"
            value={formatPercent(callAnswerRate(counts))}
          />
          <LiveStat
            label="Comparecimento"
            value={formatPercent(meetingAttendanceRate(counts))}
          />
          <LiveStat
            label="Ticket médio"
            value={
              averageTicketCents(counts) === null
                ? "—"
                : formatBRLCents(averageTicketCents(counts)!)
            }
          />
        </CardContent>
      </Card>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando…" : "Enviar report"}
      </Button>
    </form>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="heading text-lg text-primary">{value}</p>
    </div>
  );
}
