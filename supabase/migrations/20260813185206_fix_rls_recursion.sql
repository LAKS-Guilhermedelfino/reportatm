-- Bug: current_role()/current_company_id() eram SECURITY INVOKER e liam
-- `profiles`. Isso faz essa leitura interna reavaliar as policies de RLS de
-- `profiles` — inclusive "profiles_admin_all", que chama is_admin(), que
-- chama current_role(), que lê `profiles` de novo: recursão infinita
-- ("stack depth limit exceeded"), pega pelos testes de RLS.
--
-- Fix (padrão recomendado pelo Supabase para este caso): estas duas funções
-- passam a SECURITY DEFINER, rodando como o dono (postgres, bypassa RLS),
-- então a leitura interna não reavalia as policies de profiles e a recursão
-- não acontece. Ainda são seguras porque só devolvem o role/company_id do
-- PRÓPRIO usuário autenticado (auth.uid()), nunca um id arbitrário.
create or replace function private.current_company_id()
returns uuid
language plpgsql
stable
security definer
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
security definer
set search_path = public
as $$
begin
  return (select role from profiles where id = auth.uid());
end;
$$;
