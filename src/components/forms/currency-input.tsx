"use client";

import { Label } from "@/components/ui/label";
import { formatBRLCents } from "@/lib/format/currency";

type CurrencyInputProps = {
  id: string;
  name: string;
  label: string;
  valueCents: number;
  onChange: (cents: number) => void;
};

/**
 * Campo de valor de venda com máscara BRL (seção 8.2). Digita só números;
 * os dois últimos são os centavos — como qualquer campo de valor monetário
 * de app de banco.
 */
export function CurrencyInput({
  id,
  name,
  label,
  valueCents,
  onChange,
}: CurrencyInputProps) {
  function handleChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    const cents = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
    onChange(cents);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        value={formatBRLCents(valueCents)}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-lg font-medium tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
