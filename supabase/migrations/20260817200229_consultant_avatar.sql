-- Foto da consultora, pro ranking visual do dashboard.
alter table profiles add column avatar_url text;

-- Bucket público (só foto de perfil, sem dado sensível) — leitura anônima
-- direta pela URL pública, sem precisar de policy de SELECT. Toda escrita
-- passa pela Server Action com service role (bypassa RLS), então não há
-- policy de INSERT/UPDATE aqui — mesmo padrão de outras escritas
-- privilegiadas do sistema (ver invite-consultant.ts, invite-admin-user.ts).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
