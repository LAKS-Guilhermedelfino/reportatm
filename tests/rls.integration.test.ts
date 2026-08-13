/**
 * Testes de política de RLS — rodam contra o projeto Supabase real (ver
 * PLAN.md: sem Docker disponível neste ambiente para `supabase start`
 * local). Criam empresas/usuários/reports de teste via service_role e
 * limpam tudo ao final. Cobrem o critério de aceite mais crítico da seção
 * 14: "uma consultora não consegue acessar dado de outra por nenhuma via".
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e
 * SUPABASE_SERVICE_ROLE_KEY em .env.local — os testes são pulados
 * (describe.skip) se não estiverem presentes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasEnv = Boolean(url && anonKey && serviceRoleKey);

const suite = hasEnv ? describe : describe.skip;

suite("RLS — daily_reports e goals", () => {
  const admin: SupabaseClient<Database> = createClient(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const runId = Date.now();
  const companySlug = `teste-rls-${runId}`;
  const password = `Teste!${runId}Aa`;

  let companyId: string;
  let adminUserId: string;
  let gestoraUserId: string;
  let consultoraAId: string;
  let consultoraBId: string;
  let reportAId: string;
  let reportBId: string;

  async function createTestUser(label: string) {
    const email = `rls-${label}-${runId}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Falha ao criar usuário de teste (${label}): ${error?.message}`);
    }
    return { id: data.user.id, email };
  }

  function clientFor(email: string) {
    return createClient<Database>(url!, anonKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    }).auth
      .signInWithPassword({ email, password })
      .then(({ data, error }) => {
        if (error || !data.session) {
          throw new Error(`Falha ao autenticar ${email}: ${error?.message}`);
        }
        return createClient<Database>(url!, anonKey!, {
          auth: { autoRefreshToken: false, persistSession: false },
          global: {
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          },
        });
      });
  }

  beforeAll(async () => {
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({ name: "Empresa Teste RLS", slug: companySlug })
      .select("id")
      .single();
    if (companyError || !company) {
      throw new Error(`Falha ao criar empresa de teste: ${companyError?.message}`);
    }
    companyId = company.id;

    const [adminUser, gestoraUser, consultoraA, consultoraB] = await Promise.all([
      createTestUser("admin"),
      createTestUser("gestora"),
      createTestUser("consultora-a"),
      createTestUser("consultora-b"),
    ]);
    adminUserId = adminUser.id;
    gestoraUserId = gestoraUser.id;
    consultoraAId = consultoraA.id;
    consultoraBId = consultoraB.id;

    const { error: profilesError } = await admin.from("profiles").insert([
      { id: adminUserId, company_id: companyId, full_name: "Admin Teste", email: adminUser.email, role: "admin" },
      { id: gestoraUserId, company_id: companyId, full_name: "Gestora Teste", email: gestoraUser.email, role: "gestora" },
      { id: consultoraAId, company_id: companyId, full_name: "Consultora A", email: consultoraA.email, role: "consultora" },
      { id: consultoraBId, company_id: companyId, full_name: "Consultora B", email: consultoraB.email, role: "consultora" },
    ]);
    if (profilesError) {
      throw new Error(`Falha ao criar perfis de teste: ${profilesError.message}`);
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: reports, error: reportsError } = await admin
      .from("daily_reports")
      .insert([
        { company_id: companyId, consultant_id: consultoraAId, report_date: today, calls_made: 10 },
        { company_id: companyId, consultant_id: consultoraBId, report_date: today, calls_made: 20 },
      ])
      .select("id, consultant_id");
    if (reportsError || !reports) {
      throw new Error(`Falha ao criar reports de teste: ${reportsError?.message}`);
    }
    reportAId = reports.find((r) => r.consultant_id === consultoraAId)!.id;
    reportBId = reports.find((r) => r.consultant_id === consultoraBId)!.id;
  }, 30_000);

  afterAll(async () => {
    await admin.from("daily_reports").delete().eq("company_id", companyId);
    await admin.from("goals").delete().eq("company_id", companyId);
    for (const id of [adminUserId, gestoraUserId, consultoraAId, consultoraBId]) {
      if (id) await admin.auth.admin.deleteUser(id);
    }
    if (companyId) await admin.from("companies").delete().eq("id", companyId);
  }, 30_000);

  it("consultora A não vê o report da consultora B via select geral", async () => {
    const asA = await clientFor(`rls-consultora-a-${runId}@example.com`);
    const { data, error } = await asA.from("daily_reports").select("id, consultant_id");
    expect(error).toBeNull();
    expect(data?.some((r) => r.id === reportBId)).toBe(false);
    expect(data?.some((r) => r.id === reportAId)).toBe(true);
  });

  it("consultora A não vê o report da consultora B via ID direto", async () => {
    const asA = await clientFor(`rls-consultora-a-${runId}@example.com`);
    const { data, error } = await asA
      .from("daily_reports")
      .select("id")
      .eq("id", reportBId)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("consultora A não consegue editar o report da consultora B", async () => {
    const asA = await clientFor(`rls-consultora-a-${runId}@example.com`);
    const { data, error } = await asA
      .from("daily_reports")
      .update({ calls_made: 999 })
      .eq("id", reportBId)
      .select("id");
    expect(error).toBeNull();
    // RLS bloqueia silenciosamente: nenhuma linha afetada, não é um erro.
    expect(data).toEqual([]);

    const { data: check } = await admin
      .from("daily_reports")
      .select("calls_made")
      .eq("id", reportBId)
      .single();
    expect(check?.calls_made).toBe(20);
  });

  it("gestora vê os reports de ambas as consultoras da própria empresa", async () => {
    const asGestora = await clientFor(`rls-gestora-${runId}@example.com`);
    const { data, error } = await asGestora
      .from("daily_reports")
      .select("id")
      .eq("company_id", companyId);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id).sort()).toEqual([reportAId, reportBId].sort());
  });

  it("admin vê os reports de ambas as consultoras", async () => {
    const asAdmin = await clientFor(`rls-admin-${runId}@example.com`);
    const { data, error } = await asAdmin
      .from("daily_reports")
      .select("id")
      .eq("company_id", companyId);
    expect(error).toBeNull();
    expect(data?.map((r) => r.id).sort()).toEqual([reportAId, reportBId].sort());
  });

  it("consultora não consegue inserir meta (goals) para si mesma", async () => {
    const asA = await clientFor(`rls-consultora-a-${runId}@example.com`);
    const { error } = await asA.from("goals").insert({
      company_id: companyId,
      consultant_id: consultoraAId,
      period_type: "monthly",
      period_start: "2026-01-01",
      period_end: "2026-01-31",
      goal_calls_made: 100,
    });
    expect(error).not.toBeNull();
  });
}, 60_000);
