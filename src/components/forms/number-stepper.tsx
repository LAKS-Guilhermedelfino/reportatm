"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type NumberStepperProps = {
  id: string;
  name: string;
  label: string;
  help?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

/**
 * Input numérico grande para preenchimento no celular (seção 8.2/9):
 * botões +/- em vez de spinner minúsculo, teclado numérico, sem precisar
 * de precisão de toque para digitar.
 */
export function NumberStepper({
  id,
  name,
  label,
  help,
  value,
  onChange,
  className,
}: NumberStepperProps) {
  function commit(next: number) {
    onChange(Number.isFinite(next) && next >= 0 ? next : 0);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Diminuir ${label}`}
          onClick={() => commit(value - 1)}
          className="size-11 shrink-0"
        >
          <Minus />
        </Button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => commit(e.target.valueAsNumber)}
          onFocus={(e) => e.target.select()}
          className="h-11 w-full rounded-sm border border-input bg-transparent text-center text-lg font-medium tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Aumentar ${label}`}
          onClick={() => commit(value + 1)}
          className="size-11 shrink-0"
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
