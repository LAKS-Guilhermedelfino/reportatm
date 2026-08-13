create table goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id),
  -- nulo = meta padrão da empresa, fallback para quem não tem meta própria.
  consultant_id uuid references profiles (id),
  period_type text not null check (period_type in ('monthly', 'biweekly', 'weekly', 'daily')),
  period_start date not null,
  period_end date not null,

  goal_followup_cold integer check (goal_followup_cold is null or goal_followup_cold >= 0),
  goal_followup_warm integer check (goal_followup_warm is null or goal_followup_warm >= 0),
  goal_followup_hot integer check (goal_followup_hot is null or goal_followup_hot >= 0),
  goal_calls_made integer check (goal_calls_made is null or goal_calls_made >= 0),
  goal_meetings_scheduled integer check (goal_meetings_scheduled is null or goal_meetings_scheduled >= 0),
  goal_meetings_held integer check (goal_meetings_held is null or goal_meetings_held >= 0),
  goal_proposals_submitted integer check (goal_proposals_submitted is null or goal_proposals_submitted >= 0),
  goal_sales_closed integer check (goal_sales_closed is null or goal_sales_closed >= 0),
  goal_sales_amount_cents bigint check (goal_sales_amount_cents is null or goal_sales_amount_cents >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (period_end >= period_start),

  -- Sem sobreposição de períodos para a mesma consultora (ou meta padrão da
  -- empresa, quando consultant_id é nulo) e mesmo period_type.
  exclude using gist (
    company_id with =,
    coalesce(consultant_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
    period_type with =,
    daterange(period_start, period_end, '[]') with &&
  )
);

create index goals_company_id_idx on goals (company_id);
create index goals_consultant_id_idx on goals (consultant_id);

create trigger set_updated_at
  before update on goals
  for each row execute function private.set_updated_at();

alter table goals enable row level security;

create policy "goals_admin_all"
  on goals for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Gestora cadastra e edita as metas da própria empresa (seção 8.3 /metas).
create policy "goals_gestora_all"
  on goals for all
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id())
  with check (private.is_gestora() and company_id = private.current_company_id());

-- Consultora só enxerga a própria meta e a meta padrão da empresa
-- (fallback), nunca escreve (seção 5: "vê apenas... as próprias metas").
create policy "goals_select_own"
  on goals for select
  to authenticated
  using (
    private.is_consultora()
    and company_id = private.current_company_id()
    and (consultant_id = auth.uid() or consultant_id is null)
  );
