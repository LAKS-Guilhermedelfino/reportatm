create table audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id),
  actor_id uuid references profiles (id),
  action text not null,
  entity text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index audit_log_company_id_idx on audit_log (company_id);
create index audit_log_entity_idx on audit_log (entity, entity_id);

alter table audit_log enable row level security;

-- Log é escrito apenas por triggers SECURITY DEFINER (ver
-- audit_triggers.sql) — de propósito, não existe policy de INSERT/UPDATE/
-- DELETE para nenhum papel, nem admin: audit log é append-only e não
-- editável via API.
create policy "audit_log_select_admin"
  on audit_log for select
  to authenticated
  using (private.is_admin());

create policy "audit_log_select_gestora"
  on audit_log for select
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id());
