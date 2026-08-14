import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * "/" nunca é uma tela em si — só despacha pro destino certo conforme o
 * perfil logado (seção 5). Consultora não tem acesso às telas do gestor e
 * vice-versa; os layouts de (gestor)/(consultora) mandam de volta pra cá se
 * o perfil não bater, então evite redirecionar aqui pra um destino que o
 * perfil não pode acessar.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "consultora") {
    redirect("/meu-report");
  }

  redirect("/dashboard");
}
