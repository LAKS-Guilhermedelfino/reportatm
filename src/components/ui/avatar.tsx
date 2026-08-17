import { cn } from "@/lib/utils";

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Foto da pessoa, ou iniciais como placeholder — nunca ícone genérico. */
export function Avatar({
  fullName,
  src,
  size = "md",
  className,
}: {
  fullName: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = {
    sm: "size-8 text-xs",
    md: "size-11 text-sm",
    lg: "size-16 text-lg",
  }[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatares vêm do Supabase Storage, domínio dinâmico por projeto
      <img
        src={src}
        alt={fullName}
        className={cn(sizeClass, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={fullName}
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-medium text-muted-foreground",
        className,
      )}
    >
      {initials(fullName)}
    </div>
  );
}
