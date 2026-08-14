"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Texto-resumo copiável pro WhatsApp do time (seção 8.3). */
export function WhatsAppCopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <textarea
        readOnly
        value={text}
        rows={12}
        className="w-full resize-none rounded-md border border-border bg-surface-2 p-3 font-mono text-xs text-foreground"
      />
      <Button type="button" size="sm" onClick={copy}>
        {copied ? "Copiado!" : "Copiar texto"}
      </Button>
    </div>
  );
}
