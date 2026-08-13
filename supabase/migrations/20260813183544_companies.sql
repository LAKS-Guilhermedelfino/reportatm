create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on companies
  for each row execute function private.set_updated_at();

alter table companies enable row level security;

-- Admin: acesso total.
create policy "companies_admin_all"
  on companies for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Gestora e consultora enxergam apenas a própria empresa (somente leitura —
-- cadastro de empresa é exclusivo do admin, seção 5).
create policy "companies_select_own"
  on companies for select
  to authenticated
  using (id = private.current_company_id());
