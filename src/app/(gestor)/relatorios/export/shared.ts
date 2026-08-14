import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { getPeriod, type PeriodType } from "@/lib/dates/periods";
import { todaySP } from "@/lib/dates/sao-paulo";

/** /relatorios só oferece semanal, quinzenal e mensal (seção 8.3). */
export const REPORT_PERIOD_TYPES: PeriodType[] = ["weekly", "biweekly", "monthly"];

export type ExportContext = {
  supabase: SupabaseClient<Database>;
  companyId: string;
  companyName: string;
  scope: "individual" | "time";
  type: PeriodType;
  period: { start: string; end: string };
  today: string;
  consultantId: string | null;
};

/**
 * Autentica (só admin/gestora — seção 5), resolve empresa e período a
 * partir da query string, e valida o consultantId contra a empresa do
 * usuário logado antes de expor qualquer dado. Nunca confia em company_id
 * vindo do client.
 */
export async function resolveExportContext(
  searchParams: URLSearchParams,
): Promise<{ ok: true; ctx: ExportContext } | { ok: false; response: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "não autenticado" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "gestora")) {
    return { ok: false, response: NextResponse.json({ error: "acesso negado" }, { status: 403 }) };
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single();

  const scope = searchParams.get("scope") === "individual" ? "individual" : "time";
  const type: PeriodType = REPORT_PERIOD_TYPES.includes(searchParams.get("period") as PeriodType)
    ? (searchParams.get("period") as PeriodType)
    : "weekly";
  const today = todaySP();
  const referenceDate = searchParams.get("date") ?? today;
  const period = getPeriod(type, referenceDate);

  let consultantId: string | null = null;
  if (scope === "individual") {
    consultantId = searchParams.get("consultantId");
    if (!consultantId) {
      return { ok: false, response: NextResponse.json({ error: "consultantId obrigatório" }, { status: 400 }) };
    }
    const { data: consultant } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", consultantId)
      .eq("company_id", profile.company_id)
      .eq("role", "consultora")
      .maybeSingle();
    if (!consultant) {
      return { ok: false, response: NextResponse.json({ error: "consultora não encontrada" }, { status: 404 }) };
    }
  }

  const companyName = company?.name ?? "";

  return {
    ok: true,
    ctx: {
      supabase,
      companyId: profile.company_id,
      companyName,
      scope,
      type,
      period,
      today,
      consultantId,
    },
  };
}
