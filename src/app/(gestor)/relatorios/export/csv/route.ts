import { NextRequest, NextResponse } from "next/server";
import { buildIndividualCsv, buildTeamCsv } from "@/lib/reports/csv";
import { loadIndividualDailyRows } from "@/lib/reports/load-report-data";
import { loadTeamData } from "@/lib/dashboard/team-data";
import { resolveExportContext } from "../shared";

export async function GET(request: NextRequest) {
  const result = await resolveExportContext(request.nextUrl.searchParams);
  if (!result.ok) return result.response;
  const { supabase, companyId, scope, type, period, consultantId } = result.ctx;

  let csv: string;
  let filename: string;

  if (scope === "individual" && consultantId) {
    const { data: consultant } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", consultantId)
      .single();
    const fullName = consultant?.full_name ?? "";
    const rows = await loadIndividualDailyRows(supabase, consultantId, period);
    csv = buildIndividualCsv(fullName, rows);
    filename = `relatorio-${fullName.toLowerCase().replace(/\s+/g, "-")}-${period.start}-a-${period.end}.csv`;
  } else {
    const teamData = await loadTeamData(supabase, companyId, type, period);
    csv = buildTeamCsv(teamData.consultants.map((c) => ({ fullName: c.fullName, totals: c.totals })));
    filename = `relatorio-time-${period.start}-a-${period.end}.csv`;
  }

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
