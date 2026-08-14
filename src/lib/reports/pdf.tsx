import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatBRLCents, formatPercent } from "@/lib/format/currency";
import { GOAL_INDICATORS } from "@/lib/metrics/goal-indicators";
import { goalAttainment, goalStatus } from "@/lib/metrics/goals";
import { GOAL_STATUS_DISPLAY } from "@/lib/metrics/goal-status-display";
import type { Severity } from "@/lib/diagnostics/types";
import type { IndividualReportData, TeamReportData } from "./types";

/**
 * PDF com a identidade LAKS (seção 8.3): paleta da marca e títulos em
 * caixa alta. Tipografia usa a família Helvetica nativa do react-pdf (sem
 * fetch de fonte em runtime) — Helvetica é literalmente aparentada à
 * Helvetica Neue, a fonte de corpo real da marca (seção 4.2), então é uma
 * substituta razoável até os arquivos de Neuething Sans chegarem.
 */
const COLORS = {
  primary: "#FF4200",
  raisinBlack: "#0D0900",
  grey: "#6B6B6B",
  border: "#D9D9D9",
  surface: "#F6F6F6",
  success: "#16A34A",
  warning: "#B45309",
  danger: "#DC2626",
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critico: COLORS.danger,
  atencao: COLORS.warning,
  observacao: COLORS.grey,
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.raisinBlack,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  logoBadge: { width: 14, height: 14, backgroundColor: COLORS.primary, borderRadius: 3, marginRight: 8 },
  logoText: { fontFamily: "Helvetica-Bold", fontSize: 14, letterSpacing: 1 },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 2,
  },
  subtitle: { fontSize: 10, color: COLORS.grey, marginBottom: 16 },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.raisinBlack,
  },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap" },
  kpiCard: {
    width: "25%",
    paddingRight: 8,
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 8, color: COLORS.grey, marginBottom: 2 },
  kpiValue: { fontFamily: "Helvetica-Bold", fontSize: 13 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
  },
  rowLabel: { color: COLORS.grey },
  finding: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  findingTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  severityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  findingTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, textTransform: "uppercase" },
  findingMetric: { fontSize: 8, color: COLORS.grey, marginBottom: 2 },
  findingAction: { fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: COLORS.grey,
    textAlign: "center",
  },
});

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.logoBadge} />
        <Text style={styles.logoText}>LAKS</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function Footer() {
  return (
    <Text style={styles.footer} fixed>
      Gerado por LAKS Report Comercial em {new Date().toLocaleDateString("pt-BR")}
    </Text>
  );
}

function FindingsSection({ findings }: { findings: IndividualReportData["findings"] }) {
  if (findings.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Diagnóstico</Text>
      {findings.map((f, i) => (
        <View key={i} style={styles.finding} wrap={false}>
          <View style={styles.findingTitleRow}>
            <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[f.severity] }]} />
            <Text style={styles.findingTitle}>{f.title}</Text>
          </View>
          <Text style={styles.findingMetric}>{f.metric}</Text>
          <Text style={styles.findingAction}>{f.action}</Text>
        </View>
      ))}
    </View>
  );
}

export function IndividualReportPdf({
  data,
  businessDaysElapsed,
  businessDaysTotal,
}: {
  data: IndividualReportData;
  businessDaysElapsed: number;
  businessDaysTotal: number;
}) {
  const goalRows = GOAL_INDICATORS.filter((i) => data.goal && data.goal[i.key] !== null);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          title={`Relatório comercial — ${data.periodLabel}`}
          subtitle={`${data.consultantName} · ${data.companyName}`}
        />

        <Text style={styles.sectionTitle}>Resumo do período</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vendas fechadas</Text>
            <Text style={styles.kpiValue}>{data.totals.sales_closed}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Valor vendido</Text>
            <Text style={styles.kpiValue}>{formatBRLCents(data.totals.sales_amount_cents)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ligações realizadas</Text>
            <Text style={styles.kpiValue}>{data.totals.calls_made}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Reuniões realizadas</Text>
            <Text style={styles.kpiValue}>{data.totals.meetings_held}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Propostas lançadas</Text>
            <Text style={styles.kpiValue}>{data.totals.proposals_submitted}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Taxa de preenchimento</Text>
            <Text style={styles.kpiValue}>{formatPercent(data.fillRate.rate)}</Text>
          </View>
        </View>

        {goalRows.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Metas</Text>
            {goalRows.map((indicator) => {
              const realizado = indicator.realizado(data.totals);
              const meta = data.goal![indicator.key] as number;
              const attainment = goalAttainment(realizado, meta);
              const status = goalStatus(realizado, meta, businessDaysElapsed, businessDaysTotal);
              const realizadoFmt = indicator.isMoney ? formatBRLCents(realizado) : realizado;
              const metaFmt = indicator.isMoney ? formatBRLCents(meta) : meta;
              return (
                <View key={indicator.key} style={styles.row}>
                  <Text style={styles.rowLabel}>{indicator.label}</Text>
                  <Text>
                    {realizadoFmt}/{metaFmt} ({formatPercent(attainment)} — {GOAL_STATUS_DISPLAY[status].label})
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <FindingsSection findings={data.findings} />

        <Footer />
      </Page>
    </Document>
  );
}

export function TeamReportPdf({ data }: { data: TeamReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          title={`Relatório do time — ${data.periodLabel}`}
          subtitle={data.companyName}
        />

        <Text style={styles.sectionTitle}>Resumo do time</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total vendido</Text>
            <Text style={styles.kpiValue}>{formatBRLCents(data.teamTotals.sales_amount_cents)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vendas</Text>
            <Text style={styles.kpiValue}>{data.teamTotals.sales_closed}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ligações</Text>
            <Text style={styles.kpiValue}>{data.teamTotals.calls_made}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Preenchimento do time</Text>
            <Text style={styles.kpiValue}>{formatPercent(data.teamFillRate.rate)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Por consultora</Text>
        {data.consultants.map((c) => (
          <View key={c.fullName} style={styles.row}>
            <Text style={styles.rowLabel}>{c.fullName}</Text>
            <Text>
              {c.totals.calls_made} ligações · {c.totals.sales_closed} venda(s) ·{" "}
              {formatBRLCents(c.totals.sales_amount_cents)}
            </Text>
          </View>
        ))}

        <FindingsSection findings={data.aggregatedFindings} />

        {data.topAttention.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Quem mais precisa de atenção</Text>
            {data.topAttention.map((t, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowLabel}>{t.fullName}</Text>
                <Text>{t.reason}</Text>
              </View>
            ))}
          </View>
        )}

        <Footer />
      </Page>
    </Document>
  );
}
