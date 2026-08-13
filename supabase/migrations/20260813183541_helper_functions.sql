-- Schema não exposto pela API do PostgREST (Supabase só expõe `public` por
-- padrão) — usado para funções auxiliares de RLS e triggers internos.
create schema if not exists private;

-- Funções abaixo são `language plpgsql` (em vez de `sql`) de propósito: o
-- corpo de uma função `sql` é resolvido contra os objetos do schema já no
-- CREATE FUNCTION, e esta migration roda antes da tabela `profiles` existir
-- (ela só aparece na migration seguinte). plpgsql adia essa resolução para a
-- primeira execução, quebrando essa dependência circular de ordem.

-- company_id do usuário autenticado, a partir de profiles.id = auth.uid().
-- SECURITY INVOKER (default): a política "consultora vê a própria linha" em
-- profiles autoriza essa leitura sem depender desta função, então não há
-- recursão nem necessidade de elevar privilégio aqui.
create or replace function private.current_company_id()
returns uuid
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  return (select company_id from profiles where id = auth.uid());
end;
$$;

create or replace function private.current_role()
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  return (select role from profiles where id = auth.uid());
end;
$$;

create or replace function private.is_admin()
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  return coalesce(private.current_role() = 'admin', false);
end;
$$;

create or replace function private.is_gestora()
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  return coalesce(private.current_role() = 'gestora', false);
end;
$$;

create or replace function private.is_consultora()
returns boolean
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  return coalesce(private.current_role() = 'consultora', false);
end;
$$;

-- "Dia" do report é a data local em America/Sao_Paulo (seção 7.1), não UTC.
-- Não referencia tabelas, então pode continuar como `sql`.
create or replace function private.today_sp()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_company_id() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_gestora() to authenticated;
grant execute on function private.is_consultora() to authenticated;
grant execute on function private.today_sp() to authenticated;

-- Mantém updated_at em dia em qualquer UPDATE, em todas as tabelas do app.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
