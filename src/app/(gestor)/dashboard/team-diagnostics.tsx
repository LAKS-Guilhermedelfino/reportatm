import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FindingsList } from "@/components/diagnostics/findings-list";
import { limitFindings, SEVERITY_ORDER, type Finding } from "@/lib/diagnostics/types";

export type ConsultantFindings = {
  id: string;
  fullName: string;
  findings: Finding[];
};

/**
 * Seção DIAGNÓSTICO DO TIME (seção 8.3): achados agregados + as 3
 * consultoras que mais precisam de atenção, uma linha cada.
 */
export function TeamDiagnostics({ perConsultant }: { perConsultant: ConsultantFindings[] }) {
  const allFindings = perConsultant.flatMap((c) => c.findings);
  const aggregated = limitFindings(allFindings);

  const attentionScore = (findings: Finding[]) => {
    const criticos = findings.filter((f) => f.severity === "critico").length;
    const atencoes = findings.filter((f) => f.severity === "atencao").length;
    return criticos * 100 + atencoes * 10 + findings.length;
  };

  const topAttention = [...perConsultant]
    .filter((c) => c.findings.length > 0)
    .sort((a, b) => attentionScore(b.findings) - attentionScore(a.findings))
    .slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FindingsList findings={aggregated} />

      <Card>
        <CardHeader>
          <CardTitle className="heading text-base">
            Quem mais precisa de atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguém com pontos de atenção neste período.
            </p>
          ) : (
            <ul className="space-y-3">
              {topAttention.map((c) => {
                const top = [...c.findings].sort(
                  (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
                )[0];
                return (
                  <li key={c.id} className="text-sm">
                    <Link
                      href={`/consultoras/${c.id}`}
                      className="text-foreground hover:underline"
                    >
                      {c.fullName}
                    </Link>
                    <span className="text-muted-foreground"> — {top.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
