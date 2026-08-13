-- private.prepare_daily_report_row() (trigger em daily_reports, não
-- SECURITY DEFINER) chama private.today_sp() na escrita, então qualquer
-- papel que grave nessa tabela precisa de USAGE no schema — inclusive
-- service_role, que não tinha sido contemplado na migration de helpers.
grant usage on schema private to service_role;
grant execute on all functions in schema private to service_role;

-- Garante que funções futuras criadas em `private` já nasçam liberadas
-- para authenticated/service_role, sem precisar lembrar de um grant manual.
alter default privileges in schema private
  grant execute on functions to authenticated, service_role;
