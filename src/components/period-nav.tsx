import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Period, PeriodType } from "@/lib/dates/periods";
import { formatDateLongPtBR } from "@/lib/dates/sao-paulo";

export type PeriodTab = { type: PeriodType; label: string };

/**
 * Seletor de período reaproveitado em /meu-desempenho, /metas, /dashboard e
 * /comparativo — cada tela escolhe seus próprios `tabs` (algumas incluem
 * "daily", outras "custom") e o `basePath` da própria rota.
 */
export function PeriodNav({
  basePath,
  tabs,
  type,
  period,
  referenceDate,
  prevHref,
  nextHref,
  allowCustom = false,
}: {
  basePath: string;
  tabs: PeriodTab[];
  type: PeriodType;
  period: Period;
  referenceDate: string;
  prevHref: string;
  nextHref: string;
  allowCustom?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.type}
            href={`${basePath}?period=${tab.type}&date=${referenceDate}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              tab.type === type
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
        {allowCustom && (
          <Link
            href={`${basePath}?period=custom&date=${referenceDate}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm transition-colors",
              type === "custom"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Personalizado
          </Link>
        )}
      </div>

      {type === "custom" ? (
        <form
          action={basePath}
          method="get"
          className="flex flex-wrap items-end gap-2"
        >
          <input type="hidden" name="period" value="custom" />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="start">
              De
            </label>
            <input
              id="start"
              name="start"
              type="date"
              defaultValue={period.start}
              className="h-9 rounded-sm border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="end">
              Até
            </label>
            <input
              id="end"
              name="end"
              type="date"
              defaultValue={period.end}
              className="h-9 rounded-sm border border-input bg-transparent px-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Aplicar
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex w-full justify-between sm:contents">
            <Link href={prevHref} className="hover:text-foreground">
              ‹ Anterior
            </Link>
            <span className="hidden text-foreground sm:inline">
              {formatDateLongPtBR(period.start)} — {formatDateLongPtBR(period.end)}
            </span>
            <Link href={nextHref} className="hover:text-foreground">
              Seguinte ›
            </Link>
          </div>
          <span className="text-center text-foreground sm:hidden">
            {formatDateLongPtBR(period.start)} — {formatDateLongPtBR(period.end)}
          </span>
        </div>
      )}
    </div>
  );
}
