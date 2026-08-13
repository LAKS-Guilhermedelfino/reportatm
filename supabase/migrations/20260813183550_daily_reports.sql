create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id),
  consultant_id uuid not null references profiles (id),
  report_date date not null,
  filled_at timestamptz,
  filled_by uuid references profiles (id),
  -- true quando o preenchimento/edição aconteceu após o dia de referência
  -- (janela de 2 dias da seção 7.2). Recalculado por trigger, nunca vindo do client.
  late boolean not null default false,
  notes text,

  -- Bloco 1 — Leads
  new_leads_received integer not null default 0 check (new_leads_received >= 0),
  new_leads_contacted integer not null default 0 check (new_leads_contacted >= 0),
  old_leads_contacted integer not null default 0 check (old_leads_contacted >= 0),
  old_leads_replied integer not null default 0 check (old_leads_replied >= 0),

  -- Bloco 2 — Follow-ups por temperatura
  followup_cold_done integer not null default 0 check (followup_cold_done >= 0),
  followup_cold_replied integer not null default 0 check (followup_cold_replied >= 0),
  followup_warm_done integer not null default 0 check (followup_warm_done >= 0),
  followup_warm_replied integer not null default 0 check (followup_warm_replied >= 0),
  followup_hot_done integer not null default 0 check (followup_hot_done >= 0),
  followup_hot_replied integer not null default 0 check (followup_hot_replied >= 0),

  -- Bloco 3 — Ligações
  calls_made integer not null default 0 check (calls_made >= 0),
  calls_answered integer not null default 0 check (calls_answered >= 0),

  -- Bloco 4 — Reuniões
  meetings_scheduled integer not null default 0 check (meetings_scheduled >= 0),
  meetings_held integer not null default 0 check (meetings_held >= 0),

  -- Bloco 5 — Comercial
  quotes_sent integer not null default 0 check (quotes_sent >= 0),
  negotiations_open integer not null default 0 check (negotiations_open >= 0),
  proposals_submitted integer not null default 0 check (proposals_submitted >= 0),
  sales_closed integer not null default 0 check (sales_closed >= 0),
  sales_amount_cents bigint not null default 0 check (sales_amount_cents >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (consultant_id, report_date)
);

create index daily_reports_company_id_idx on daily_reports (company_id);
create index daily_reports_consultant_report_date_idx on daily_reports (consultant_id, report_date);

create trigger set_updated_at
  before update on daily_reports
  for each row execute function private.set_updated_at();

-- Preenche filled_at/filled_by no primeiro insert e recalcula `late` a cada
-- escrita — nunca confiar em valores vindos do client para esses três campos.
create or replace function private.prepare_daily_report_row()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.filled_at := coalesce(new.filled_at, now());
    new.filled_by := coalesce(new.filled_by, auth.uid());
  end if;
  new.late := new.report_date < private.today_sp();
  return new;
end;
$$;

create trigger prepare_daily_report_row
  before insert or update on daily_reports
  for each row execute function private.prepare_daily_report_row();

alter table daily_reports enable row level security;

create policy "daily_reports_admin_all"
  on daily_reports for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "daily_reports_select_gestora"
  on daily_reports for select
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id());

create policy "daily_reports_write_gestora"
  on daily_reports for insert
  to authenticated
  with check (private.is_gestora() and company_id = private.current_company_id());

create policy "daily_reports_update_gestora"
  on daily_reports for update
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id())
  with check (private.is_gestora() and company_id = private.current_company_id());

-- Consultora: só o próprio report, e só dentro da janela de hoje + 2 dias
-- anteriores (seção 7.2). Fora dessa janela ela não edita — precisa de
-- admin/gestora.
create policy "daily_reports_select_own"
  on daily_reports for select
  to authenticated
  using (private.is_consultora() and consultant_id = auth.uid());

create policy "daily_reports_insert_own"
  on daily_reports for insert
  to authenticated
  with check (
    private.is_consultora()
    and consultant_id = auth.uid()
    and company_id = private.current_company_id()
    and report_date between (private.today_sp() - 2) and private.today_sp()
  );

create policy "daily_reports_update_own"
  on daily_reports for update
  to authenticated
  using (
    private.is_consultora()
    and consultant_id = auth.uid()
    and report_date between (private.today_sp() - 2) and private.today_sp()
  )
  with check (
    private.is_consultora()
    and consultant_id = auth.uid()
    and report_date between (private.today_sp() - 2) and private.today_sp()
  );
