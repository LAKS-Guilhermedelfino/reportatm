-- Extensões necessárias: pgcrypto para gen_random_uuid(), btree_gist para a
-- constraint de não sobreposição de períodos em `goals`.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
