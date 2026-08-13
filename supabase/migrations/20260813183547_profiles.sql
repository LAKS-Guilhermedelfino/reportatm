create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id),
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'gestora', 'consultora')),
  active boolean not null default true,
  started_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_company_id_idx on profiles (company_id);

create trigger set_updated_at
  before update on profiles
  for each row execute function private.set_updated_at();

-- Impede que uma consultora se auto-promova (role/company_id/active) numa
-- UPDATE na própria linha — a política de RLS abaixo permite a ela editar o
-- próprio perfil (nome etc.), então esta trigger é o que garante que campos
-- sensíveis só mudam pela mão de admin/gestora.
create or replace function private.guard_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_consultora() and auth.uid() = old.id then
    if new.role is distinct from old.role
      or new.company_id is distinct from old.company_id
      or new.active is distinct from old.active
    then
      raise exception 'consultora não pode alterar role, company_id ou active do próprio perfil';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_self_update
  before update on profiles
  for each row execute function private.guard_profile_self_update();

alter table profiles enable row level security;

create policy "profiles_admin_all"
  on profiles for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_company_gestora"
  on profiles for select
  to authenticated
  using (private.is_gestora() and company_id = private.current_company_id());

-- Gestora cadastra e edita consultoras da própria empresa; não mexe em
-- outras gestoras/admins (seção 5).
create policy "profiles_insert_consultora_gestora"
  on profiles for insert
  to authenticated
  with check (
    private.is_gestora()
    and company_id = private.current_company_id()
    and role = 'consultora'
  );

create policy "profiles_update_consultora_gestora"
  on profiles for update
  to authenticated
  using (
    private.is_gestora()
    and company_id = private.current_company_id()
    and role = 'consultora'
  )
  with check (
    private.is_gestora()
    and company_id = private.current_company_id()
    and role = 'consultora'
  );

create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
