import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { IndividualReportPdf, TeamReportPdf } from "@/lib/reports/pdf";
import { loadIndividualReportData, loadTeamReportData } from "@/lib/reports/load-report-data";
import { countBusinessDays } from "@/lib/dates/periods";
import { resolveExportContext } from "../shared";

export async function GET(request: NextRequest) {
  const result = await resolveExportContext(request.nextUrl.searchParams);
  if (!result.ok) return result.response;
  const { supabase, companyId, companyName, scope, type, period, today, consultantId } = result.ctx;

  let buffer: Buffer;
  let filename: string;

  if (scope === "individual" && consultantId) {
    const { data: consultant } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", consultantId)
      .single();
    const fullName = consultant?.full_name ?? "";

    const data = await loadIndividualReportData(
      supabase,
      companyId,
      companyName,
      consultantId,
      fullName,
      type,
      period,
      today,
    );

    const { data: businessDaysRow } = await supabase
      .from("business_days")
      .select("weekday_mask")
      .eq("company_id", companyId)
      .maybeSingle();
    const { data: holidaysRows } = await supabase
      .from("holidays")
      .select("date")
      .eq("company_id", companyId)
      .gte("date", period.start)
      .lte("date", period.end);
    const weekdayMask = businessDaysRow?.weekday_mask ?? 31;
    const holidayDates = (holidaysRows ?? []).map((h) => h.date);
    const businessDaysTotal = countBusinessDays(period.start, period.end, weekdayMask, holidayDates);
    const elapsedEnd = period.end < today ? period.end : today;
    const businessDaysElapsed =
      elapsedEnd < period.start ? 0 : countBusinessDays(period.start, elapsedEnd, weekdayMask, holidayDates);

    buffer = await renderToBuffer(
      IndividualReportPdf({ data, businessDaysElapsed, businessDaysTotal }),
    );
    filename = `relatorio-${fullName.toLowerCase().replace(/\s+/g, "-")}-${period.start}-a-${period.end}.pdf`;
  } else {
    const data = await loadTeamReportData(supabase, companyId, companyName, type, period, today);
    buffer = await renderToBuffer(TeamReportPdf({ data }));
    filename = `relatorio-time-${period.start}-a-${period.end}.pdf`;
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
