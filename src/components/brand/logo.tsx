"use client";

import Image from "next/image";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Logo placeholder — trocar pelos arquivos reais em
 * "LAKS COMPANY [IDV]/Versões da Marca/" quando fornecidos (ver PLAN.md).
 */
export function Logo({ className }: { className?: string }) {
  const { theme } = useTheme();
  const src =
    theme === "dark"
      ? "/brand/laks-logo-on-dark.svg"
      : "/brand/laks-logo-on-light.svg";

  return (
    <Image
      src={src}
      alt="LAKS Company"
      width={160}
      height={32}
      className={className}
      priority
    />
  );
}
