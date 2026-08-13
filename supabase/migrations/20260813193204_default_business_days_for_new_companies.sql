-- Toda empresa precisa de uma config de dias úteis pra "dia não útil não
-- conta como falha" (seção 7.2) funcionar. Em vez de depender de alguém
-- lembrar de criar isso manualmente, gera default (seg-sex) automático
-- toda vez que uma empresa é criada.
create or replace function private.create_default_business_days()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into business_days (company_id, weekday_mask)
  values (new.id, 31); -- 31 = 0011111 = segunda a sexta
  return new;
end;
$$;

create trigger create_default_business_days
  after insert on companies
  for each row execute function private.create_default_business_days();

-- Backfill pra empresa que já existe (ATM Seguros, criada antes desta
-- migration) e qualquer outra que porventura já exista sem config.
insert into business_days (company_id, weekday_mask)
select id, 31 from companies
where id not in (select company_id from business_days);
