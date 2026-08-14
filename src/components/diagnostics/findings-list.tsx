import { AlertTriangle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Finding, Severity } from "@/lib/diagnostics/types";

const SEVERITY_DISPLAY: Record<
  Severity,
  { label: string; textClass: string; icon: typeof XCircle }
> = {
  critico: { label: "Crítico", textClass: "text-danger", icon: XCircle },
  atencao: { label: "Atenção", textClass: "text-warning", icon: AlertTriangle },
  observacao: { label: "Observação", textClass: "text-muted-foreground", icon: Info },
};

export function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="heading text-base">Diagnóstico</CardTitle>
      </CardHeader>
      <CardContent>
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum ponto de atenção identificado neste período.
          </p>
        ) : (
          <ul className="space-y-4">
            {findings.map((finding, index) => {
              const display = SEVERITY_DISPLAY[finding.severity];
              const Icon = display.icon;
              return (
                <li key={index} className="space-y-1 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 shrink-0 ${display.textClass}`} />
                    <span className={`text-xs font-medium ${display.textClass}`}>
                      {display.label}
                    </span>
                    <span className="heading text-sm text-foreground">
                      {finding.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{finding.metric}</p>
                  <p className="text-sm text-foreground">{finding.action}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
