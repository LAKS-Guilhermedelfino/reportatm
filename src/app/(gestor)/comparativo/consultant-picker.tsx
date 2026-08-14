"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConsultantPicker({
  consultants,
  selectedIds,
  period,
  date,
}: {
  consultants: { id: string; fullName: string }[];
  selectedIds: string[];
  period: string;
  date: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.set("date", date);
    if (next.length > 0) {
      params.set("ids", next.join(","));
    } else {
      params.delete("ids");
    }
    router.push(`/comparativo?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {consultants.map((c) => {
        const active = selectedIds.includes(c.id);
        return (
          <Button
            key={c.id}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => toggle(c.id)}
          >
            {c.fullName}
          </Button>
        );
      })}
    </div>
  );
}
