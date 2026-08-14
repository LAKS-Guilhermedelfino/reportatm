/**
 * Seed de demonstração (seção 10): cria a empresa "Corretora Demo" com 1
 * admin, 1 gestora e 5 consultoras (uma delas Andressa, com o report
 * exato da seção 1 embutido), 8 semanas de reports diários com 5 perfis
 * de desempenho distintos — cobrindo as 8 regras de diagnóstico da seção
 * 7.4 — e metas semanais/mensais pra todas.
 *
 * Idempotente: apaga e recria a empresa "Corretora Demo" a cada execução,
 * então não deixa lixo acumulado se rodar várias vezes.
 *
 * Uso: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { Client as PgClient } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !serviceRoleKey || !dbUrl) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL em .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "LaksDemo@2026";
const COMPANY_NAME = "Corretora Demo";
const COMPANY_SLUG = "corretora-demo";

// ---------------------------------------------------------------------------
// Utilidades de data (duplicadas de src/lib/dates/* — script standalone, sem
// alias @/ disponível em Node puro; ver convenção de scripts/bootstrap-company.mjs).
// ---------------------------------------------------------------------------

function todaySP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function addDaysISO(dateISO, days) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isoWeekdayOf(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() || 7; // domingo=0 -> 7
}

function isBusinessDay(dateISO, weekdayMask) {
  const bit = isoWeekdayOf(dateISO) - 1;
  return (weekdayMask & (1 << bit)) !== 0;
}

function getWeekPeriod(referenceISO) {
  const monday = addDaysISO(referenceISO, -(isoWeekdayOf(referenceISO) - 1));
  return { start: monday, end: addDaysISO(monday, 6) };
}

function getMonthPeriod(referenceISO) {
  const [y, m] = referenceISO.split("-").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(lastDay)}` };
}

// ---------------------------------------------------------------------------
// 1. Limpa execução anterior (idempotência)
// ---------------------------------------------------------------------------

console.log(`Limpando execução anterior de "${COMPANY_NAME}" (se existir)...`);

const { data: existing } = await admin
  .from("companies")
  .select("id")
  .eq("slug", COMPANY_SLUG)
  .maybeSingle();

if (existing) {
  const { data: existingProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", existing.id);
  const profileIds = (existingProfiles ?? []).map((p) => p.id);

  await admin.from("daily_reports").delete().eq("company_id", existing.id);
  await admin.from("goals").delete().eq("company_id", existing.id);
  await admin.from("audit_log").delete().eq("company_id", existing.id);
  await admin.from("holidays").delete().eq("company_id", existing.id);
  await admin.from("business_days").delete().eq("company_id", existing.id);
  await admin.from("profiles").delete().eq("company_id", existing.id);
  for (const id of profileIds) {
    await admin.auth.admin.deleteUser(id);
  }
  await admin.from("companies").delete().eq("id", existing.id);
  console.log(`Empresa anterior removida (${profileIds.length} usuário(s)).`);
}

// ---------------------------------------------------------------------------
// 2. Empresa + usuários
// ---------------------------------------------------------------------------

console.log(`Criando empresa "${COMPANY_NAME}"...`);
const { data: company, error: companyError } = await admin
  .from("companies")
  .insert({ name: COMPANY_NAME, slug: COMPANY_SLUG })
  .select("id")
  .single();
if (companyError) throw companyError;
const companyId = company.id;

const USERS = [
  { key: "admin", email: "admin@corretorademo.com.br", fullName: "Admin Demo", role: "admin" },
  { key: "gestora", email: "gestora@corretorademo.com.br", fullName: "Gestora Demo", role: "gestora" },
  { key: "andressa", email: "andressa@corretorademo.com.br", fullName: "Andressa", role: "consultora" },
  { key: "barbara", email: "barbara@corretorademo.com.br", fullName: "Bárbara", role: "consultora" },
  { key: "carla", email: "carla@corretorademo.com.br", fullName: "Carla", role: "consultora" },
  { key: "daniela", email: "daniela@corretorademo.com.br", fullName: "Daniela", role: "consultora" },
  { key: "patricia", email: "patricia@corretorademo.com.br", fullName: "Patrícia", role: "consultora" },
];

const ids = {};
for (const u of USERS) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  ids[u.key] = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    company_id: companyId,
    full_name: u.fullName,
    email: u.email,
    role: u.role,
    active: true,
    started_at: u.role === "consultora" ? "2026-01-05" : null,
  });
  if (profileErr) throw profileErr;
  console.log(`  ${u.role.padEnd(10)} ${u.fullName} <${u.email}>`);
}

// ---------------------------------------------------------------------------
// 3. Janela de 8 semanas de dias úteis (seg-sex) terminando hoje
// ---------------------------------------------------------------------------

const today = todaySP();
const currentWeekStart = getWeekPeriod(today).start;
const windowStart = addDaysISO(currentWeekStart, -7 * 7); // 7 semanas antes da atual = 8 no total

const businessDays = [];
for (let d = windowStart; d <= today; d = addDaysISO(d, 1)) {
  if (isBusinessDay(d, 31)) businessDays.push(d);
}

function dayContext(index) {
  const week = Math.floor(index / 5);
  const weekday = index % 5; // 0=segunda .. 4=sexta
  return { week, weekday };
}

// ---------------------------------------------------------------------------
// 4. Perfis de desempenho (seção 7.4 — cobrem as 8 regras de diagnóstico)
// ---------------------------------------------------------------------------

const ANDRESSA_EXAMPLE = {
  // Report exato da seção 1 (formato expandido) — plantado numa segunda-feira
  // de semana já fechada, pra estar garantidamente dentro da janela.
  new_leads_received: 3,
  new_leads_contacted: 3,
  old_leads_contacted: 6,
  old_leads_replied: 2,
  followup_cold_done: 10,
  followup_cold_replied: 1,
  followup_warm_done: 5,
  followup_warm_replied: 2,
  followup_hot_done: 2,
  followup_hot_replied: 2,
  calls_made: 35,
  calls_answered: 5,
  meetings_scheduled: 2,
  meetings_held: 2,
  quotes_sent: 4,
  negotiations_open: 2,
  proposals_submitted: 0,
  sales_closed: 1,
  sales_amount_cents: 187936,
};

/** Consistentemente acima da meta — funil equilibrado, sem achados críticos. */
function personaAndressa(index) {
  const { week, weekday } = dayContext(index);
  if (week === 6 && weekday === 0) {
    return { counts: ANDRESSA_EXAMPLE, late: false };
  }
  const counts = {
    new_leads_received: 3 + (weekday === 2 ? 1 : 0),
    old_leads_contacted: 7,
    old_leads_replied: 3,
    followup_cold_done: 8,
    followup_cold_replied: 2,
    followup_warm_done: 6,
    followup_warm_replied: 3,
    followup_hot_done: 3,
    followup_hot_replied: 2,
    calls_made: 34 + (weekday % 3),
    calls_answered: 6,
    meetings_scheduled: 2,
    meetings_held: 2,
    quotes_sent: 4,
    negotiations_open: 3,
    proposals_submitted: weekday === 4 ? 2 : 1,
    sales_closed: weekday === 4 ? 1 : 0,
  };
  counts.new_leads_contacted = counts.new_leads_received;
  counts.sales_amount_cents = counts.sales_closed > 0 ? 180000 + (index % 3) * 20000 : 0;
  return { counts, late: false };
}

/**
 * Consistentemente abaixo — meta fora do ritmo, e queda acentuada na
 * semana corrente (semana 7) versus a anterior, pra disparar "queda
 * relativa".
 */
function personaBarbara(index) {
  const { week, weekday } = dayContext(index);
  if (week < 7) {
    const counts = {
      new_leads_received: 2,
      new_leads_contacted: 1,
      old_leads_contacted: 3,
      old_leads_replied: 1,
      followup_cold_done: 5,
      followup_cold_replied: 1,
      followup_warm_done: 2,
      followup_warm_replied: 1,
      followup_hot_done: 1,
      followup_hot_replied: 0,
      calls_made: 16,
      calls_answered: 2,
      meetings_scheduled: 1,
      meetings_held: 1,
      quotes_sent: 1,
      negotiations_open: 1,
      proposals_submitted: weekday === 4 ? 1 : 0,
      sales_closed: week % 2 === 0 && weekday === 4 ? 1 : 0,
    };
    counts.sales_amount_cents = counts.sales_closed > 0 ? 90000 : 0;
    return { counts, late: false };
  }
  // Semana corrente — queda acentuada em relação à semana passada.
  const counts = {
    new_leads_received: 1,
    new_leads_contacted: 1,
    old_leads_contacted: 1,
    old_leads_replied: 0,
    followup_cold_done: 2,
    followup_cold_replied: 0,
    followup_warm_done: 1,
    followup_warm_replied: 0,
    followup_hot_done: 0,
    followup_hot_replied: 0,
    calls_made: 7,
    calls_answered: 1,
    meetings_scheduled: 0,
    meetings_held: 0,
    quotes_sent: 0,
    negotiations_open: 1,
    proposals_submitted: 0,
    sales_closed: 0,
    sales_amount_cents: 0,
  };
  return { counts, late: false };
}

/**
 * Volume alto, conversão ruim — esforço sem retorno, gargalo de funil (mal
 * atende e mal marca reunião) e funil parado (negociações estáveis, zero
 * venda).
 */
function personaCarla() {
  const counts = {
    new_leads_received: 5,
    new_leads_contacted: 5,
    old_leads_contacted: 10,
    old_leads_replied: 2,
    followup_cold_done: 15,
    followup_cold_replied: 1,
    followup_warm_done: 8,
    followup_warm_replied: 1,
    followup_hot_done: 4,
    followup_hot_replied: 0,
    calls_made: 45,
    calls_answered: 4,
    meetings_scheduled: 1,
    meetings_held: 1,
    quotes_sent: 3,
    negotiations_open: 4,
    // Sempre lança a proposta mas nunca fecha — deficit isolado no último
    // estágio do funil (proposta → venda), sem zerar a simulação de
    // impacto da regra 2 (que multiplica pela taxa REAL dela nos estágios
    // seguintes ao escolhido; se meeting_to_proposal ficasse em 0, a
    // simulação colapsaria pra zero antes de chegar em proposta → venda).
    proposals_submitted: 1,
    sales_closed: 0,
    sales_amount_cents: 0,
  };
  return { counts, late: false };
}

/** Conversão boa, volume baixo — capacidade ociosa (retorno sem esforço). */
function personaDaniela(index) {
  const { weekday } = dayContext(index);
  const counts = {
    new_leads_received: 2,
    new_leads_contacted: 2,
    old_leads_contacted: 3,
    old_leads_replied: 2,
    // Concentrado em frio de propósito — dispara a regra 7 (follow-up
    // desequilibrado, >70% numa única temperatura) sem prejudicar a
    // conversão geral dela, que não depende da mistura de temperaturas.
    followup_cold_done: 6,
    followup_cold_replied: 3,
    followup_warm_done: 1,
    followup_warm_replied: 1,
    followup_hot_done: 1,
    followup_hot_replied: 1,
    calls_made: 10,
    calls_answered: 5,
    meetings_scheduled: 3,
    meetings_held: 3,
    quotes_sent: 2,
    negotiations_open: 1,
    proposals_submitted: 2,
    sales_closed: weekday === 4 ? 1 : 0,
  };
  counts.sales_amount_cents = counts.sales_closed > 0 ? 160000 : 0;
  return { counts, late: false };
}

/**
 * Falhas de preenchimento — falta um dia útil a cada duas semanas, e
 * preenche sempre em atraso às quintas.
 */
function personaPatricia(index) {
  const { week, weekday } = dayContext(index);
  if (weekday === 1 && week % 2 === 0) return null; // falta

  const counts = {
    new_leads_received: 2,
    new_leads_contacted: 2,
    old_leads_contacted: 4,
    old_leads_replied: 1,
    followup_cold_done: 5,
    followup_cold_replied: 1,
    followup_warm_done: 3,
    followup_warm_replied: 1,
    followup_hot_done: 1,
    followup_hot_replied: 1,
    calls_made: 20,
    calls_answered: 3,
    meetings_scheduled: 1,
    meetings_held: 1,
    quotes_sent: 2,
    negotiations_open: 1,
    proposals_submitted: weekday === 4 ? 1 : 0,
    sales_closed: week % 3 === 0 && weekday === 4 ? 1 : 0,
  };
  counts.sales_amount_cents = counts.sales_closed > 0 ? 120000 : 0;
  const late = weekday === 3; // quintas sempre lançadas em atraso
  return { counts, late };
}

const CONSULTANTS = [
  { key: "andressa", persona: personaAndressa },
  { key: "barbara", persona: personaBarbara },
  { key: "carla", persona: personaCarla },
  { key: "daniela", persona: personaDaniela },
  { key: "patricia", persona: personaPatricia },
];

// ---------------------------------------------------------------------------
// 5. Bulk insert de daily_reports com o trigger de `late` desligado — ele
//    recalcula `late` como (report_date < hoje) a cada escrita, o que
//    marcaria TODO backfill histórico como atrasado (ver comentário na
//    migration). Pra plantar o perfil de disciplina de forma controlada,
//    desligamos, inserimos com o valor exato pretendido, e religamos.
// ---------------------------------------------------------------------------

const pg = new PgClient({ connectionString: dbUrl });
await pg.connect();

const COLUMNS = [
  "company_id", "consultant_id", "report_date", "filled_at", "filled_by", "late",
  "new_leads_received", "new_leads_contacted", "old_leads_contacted", "old_leads_replied",
  "followup_cold_done", "followup_cold_replied", "followup_warm_done", "followup_warm_replied",
  "followup_hot_done", "followup_hot_replied",
  "calls_made", "calls_answered", "meetings_scheduled", "meetings_held",
  "quotes_sent", "negotiations_open", "proposals_submitted", "sales_closed", "sales_amount_cents",
];

let totalRows = 0;
try {
  await pg.query("BEGIN");
  await pg.query("ALTER TABLE daily_reports DISABLE TRIGGER prepare_daily_report_row");

  for (const c of CONSULTANTS) {
    const consultantId = ids[c.key];
    const rows = [];
    businessDays.forEach((date, index) => {
      const result = c.persona(index);
      if (result === null) return; // dia útil sem report — falha de disciplina real
      const { counts, late } = result;
      const filledAt = late
        ? `${addDaysISO(date, 1)}T10:00:00-03:00`
        : `${date}T18:00:00-03:00`;
      rows.push([
        companyId, consultantId, date, filledAt, consultantId, late,
        counts.new_leads_received, counts.new_leads_contacted,
        counts.old_leads_contacted, counts.old_leads_replied,
        counts.followup_cold_done, counts.followup_cold_replied,
        counts.followup_warm_done, counts.followup_warm_replied,
        counts.followup_hot_done, counts.followup_hot_replied,
        counts.calls_made, counts.calls_answered,
        counts.meetings_scheduled, counts.meetings_held,
        counts.quotes_sent, counts.negotiations_open,
        counts.proposals_submitted, counts.sales_closed, counts.sales_amount_cents,
      ]);
    });

    if (rows.length === 0) continue;

    const valuesSql = rows
      .map((_, rowIndex) => {
        const placeholders = COLUMNS.map((_, colIndex) => `$${rowIndex * COLUMNS.length + colIndex + 1}`);
        return `(${placeholders.join(", ")})`;
      })
      .join(", ");
    const flatParams = rows.flat();

    await pg.query(
      `INSERT INTO daily_reports (${COLUMNS.join(", ")}) VALUES ${valuesSql}`,
      flatParams,
    );
    totalRows += rows.length;
    console.log(`  ${rows.length} report(s) para ${c.key}`);
  }

  await pg.query("ALTER TABLE daily_reports ENABLE TRIGGER prepare_daily_report_row");
  await pg.query("COMMIT");
} catch (err) {
  await pg.query("ROLLBACK");
  throw err;
} finally {
  await pg.end();
}

console.log(`${totalRows} daily_reports inseridos ao todo.`);

// ---------------------------------------------------------------------------
// 6. Metas semanais e mensais pra todas (seção 10)
// ---------------------------------------------------------------------------

const WEEKLY_GOALS = {
  andressa: { cold: 35, warm: 25, hot: 12, calls: 150, scheduled: 8, held: 8, proposals: 8, sales: 1, amount: 200000 },
  barbara: { cold: 30, warm: 15, hot: 8, calls: 90, scheduled: 5, held: 5, proposals: 4, sales: 2, amount: 200000 },
  carla: { cold: 60, warm: 35, hot: 15, calls: 200, scheduled: 4, held: 4, proposals: 5, sales: 2, amount: 200000 },
  daniela: { cold: 25, warm: 8, hot: 8, calls: 100, scheduled: 12, held: 12, proposals: 8, sales: 1, amount: 180000 },
  patricia: { cold: 25, warm: 15, hot: 6, calls: 100, scheduled: 5, held: 5, proposals: 4, sales: 1, amount: 150000 },
};

function toGoalRow(g) {
  return {
    goal_followup_cold: g.cold,
    goal_followup_warm: g.warm,
    goal_followup_hot: g.hot,
    goal_calls_made: g.calls,
    goal_meetings_scheduled: g.scheduled,
    goal_meetings_held: g.held,
    goal_proposals_submitted: g.proposals,
    goal_sales_closed: g.sales,
    goal_sales_amount_cents: g.amount,
  };
}

function scale(g, factor) {
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, Math.round(v * factor)]));
}

const weekPeriod = getWeekPeriod(today);
const monthPeriod = getMonthPeriod(today);

for (const c of CONSULTANTS) {
  const consultantId = ids[c.key];
  const weekly = WEEKLY_GOALS[c.key];
  const monthly = scale(weekly, 4);

  const { error: weeklyErr } = await admin.from("goals").insert({
    company_id: companyId,
    consultant_id: consultantId,
    period_type: "weekly",
    period_start: weekPeriod.start,
    period_end: weekPeriod.end,
    ...toGoalRow(weekly),
  });
  if (weeklyErr) throw weeklyErr;

  const { error: monthlyErr } = await admin.from("goals").insert({
    company_id: companyId,
    consultant_id: consultantId,
    period_type: "monthly",
    period_start: monthPeriod.start,
    period_end: monthPeriod.end,
    ...toGoalRow(monthly),
  });
  if (monthlyErr) throw monthlyErr;
}
console.log("Metas semanais e mensais criadas para as 5 consultoras.");

// ---------------------------------------------------------------------------
// 7. Resumo
// ---------------------------------------------------------------------------

console.log("\nSeed concluído.");
console.log(`Empresa: ${COMPANY_NAME} (${companyId})`);
console.log(`Janela de dados: ${businessDays[0]} a ${businessDays[businessDays.length - 1]} (${businessDays.length} dias úteis)`);
console.log("\nCredenciais de demonstração (senha igual para todos):");
console.log(`  Senha: ${DEMO_PASSWORD}`);
for (const u of USERS) {
  console.log(`  ${u.role.padEnd(10)} ${u.email}`);
}
