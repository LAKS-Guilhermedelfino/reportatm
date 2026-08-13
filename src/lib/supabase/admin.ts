import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Client com service_role — ignora RLS. Uso restrito a Server Actions que
 * precisam da Admin API (convite de consultora, criação de usuário em
 * auth.users). Nunca importar em Client Components (o pacote "server-only"
 * quebra o build se isso acontecer).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
