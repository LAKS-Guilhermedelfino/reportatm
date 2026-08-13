-- weekday_mask: bits 0..6 = segunda..domingo (1 = dia útil). Default = seg-sex.
create table business_days (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references companies (id),
  weekday_mask smallint not null default 31 check (weekday_mask between 0 and 127),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on business_days
  for each row execute function private.set_updated_at();

alter table business_days enable row level security;

create policy "business_days_admin_all"
  on business_days for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "business_days_gestora_all"
  on business_days for all
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id())
  with check (private.is_gestora() and company_id = private.current_company_id());

create policy "business_days_select_consultora"
  on business_days for select
  to authenticated
  using (private.is_consultora() and company_id = private.current_company_id());

create table holidays (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id),
  date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, date)
);

create index holidays_company_id_idx on holidays (company_id);

create trigger set_updated_at
  before update on holidays
  for each row execute function private.set_updated_at();

alter table holidays enable row level security;

create policy "holidays_admin_all"
  on holidays for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "holidays_gestora_all"
  on holidays for all
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id())
  with check (private.is_gestora() and company_id = private.current_company_id());

create policy "holidays_select_consultora"
  on holidays for select
  to authenticated
  using (private.is_consultora() and company_id = private.current_company_id());
