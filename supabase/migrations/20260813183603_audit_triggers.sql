-- SECURITY DEFINER: roda com o dono da função (superuser nas migrations),
-- então grava em audit_log mesmo sem nenhuma policy de INSERT liberada para
-- authenticated — é o único caminho de escrita nessa tabela.

-- Regra 7.2: toda edição feita por admin/gestora entra no log, e todo
-- preenchimento/edição feito depois do dia de referência (late) também,
-- não importa quem.
create or replace function private.audit_daily_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if private.is_admin() or private.is_gestora() or new.report_date < private.today_sp() then
    insert into audit_log (company_id, actor_id, action, entity, entity_id, before, after)
    values (
      new.company_id,
      auth.uid(),
      tg_op,
      'daily_reports',
      new.id,
      case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
      to_jsonb(new)
    );
  end if;
  return new;
end;
$$;

create trigger audit_daily_report
  after insert or update on daily_reports
  for each row execute function private.audit_daily_report();

-- Seção 6: "Registre... toda alteração de meta" — sem condição, sempre loga.
create or replace function private.audit_goal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (company_id, actor_id, action, entity, entity_id, before, after)
  values (
    coalesce(new.company_id, old.company_id),
    auth.uid(),
    tg_op,
    'goals',
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_goal
  after insert or update or delete on goals
  for each row execute function private.audit_goal();
