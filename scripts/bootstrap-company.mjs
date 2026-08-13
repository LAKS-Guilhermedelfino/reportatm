/**
 * Bootstrap de uma nova empresa (tenant) com o primeiro usuário admin.
 * Uso único por empresa — quando a LAKS replicar o sistema para outra
 * corretora cliente, roda de novo com os dados da nova empresa.
 *
 * Uso:
 *   node scripts/bootstrap-company.mjs \
 *     --company "Nome da Corretora" \
 *     --admin-email "admin@exemplo.com" \
 *     --admin-name "Nome do Admin"
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const companyName = arg("company");
const adminEmail = arg("admin-email");
const adminName = arg("admin-name");

if (!companyName || !adminEmail || !adminName) {
  console.error(
    "Uso: node scripts/bootstrap-company.mjs --company \"Nome\" --admin-email \"e@mail.com\" --admin-name \"Nome\"",
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!url || !serviceRoleKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const slug = slugify(companyName);

console.log(`Criando empresa "${companyName}" (slug: ${slug})...`);
const { data: company, error: companyError } = await admin
  .from("companies")
  .insert({ name: companyName, slug })
  .select("id")
  .single();

if (companyError) {
  console.error("Falha ao criar empresa:", companyError.message);
  process.exit(1);
}

console.log(`Empresa criada: ${company.id}`);
console.log(`Convidando ${adminEmail} como admin...`);

const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
  adminEmail,
  { redirectTo: `${siteUrl}/primeiro-acesso` },
);

if (inviteError || !invited.user) {
  console.error("Falha ao convidar admin:", inviteError?.message);
  process.exit(1);
}

const { error: profileError } = await admin.from("profiles").insert({
  id: invited.user.id,
  company_id: company.id,
  full_name: adminName,
  email: adminEmail,
  role: "admin",
});

if (profileError) {
  console.error("Falha ao criar perfil de admin:", profileError.message);
  await admin.auth.admin.deleteUser(invited.user.id);
  process.exit(1);
}

console.log("Pronto! Convite enviado para", adminEmail);
console.log(`company_id: ${company.id}`);
console.log(`admin user id: ${invited.user.id}`);
