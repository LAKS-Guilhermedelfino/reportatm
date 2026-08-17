"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type UploadAvatarState = { error?: string; success?: boolean; avatarUrl?: string };

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Foto da consultora, pro ranking visual do dashboard. Bucket "avatars" é
 * público (só foto de perfil, sem dado sensível) — a escrita passa por
 * aqui com service role, nunca direto do client (mesmo padrão de
 * invite-consultant.ts).
 */
export async function uploadAvatar(
  _prevState: UploadAvatarState,
  formData: FormData,
): Promise<UploadAvatarState> {
  const consultantId = formData.get("consultantId") as string;
  const file = formData.get("file") as File | null;

  if (!consultantId) return { error: "Consultora inválida." };
  if (!file || file.size === 0) return { error: "Selecione uma imagem." };
  if (file.size > MAX_BYTES) return { error: "Imagem muito grande (máximo 3MB)." };

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "Formato não suportado — use PNG, JPG ou WEBP." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const [{ data: actor }, { data: target }] = await Promise.all([
    supabase.from("profiles").select("role, company_id").eq("id", user.id).single(),
    supabase.from("profiles").select("company_id, role").eq("id", consultantId).single(),
  ]);

  const isAdmin = actor?.role === "admin";
  const isGestoraOwnCompany =
    actor?.role === "gestora" && actor.company_id === target?.company_id;

  if (!target || target.role !== "consultora" || (!isAdmin && !isGestoraOwnCompany)) {
    return { error: "Você não tem permissão para editar a foto dessa consultora." };
  }

  const admin = createAdminClient();
  const path = `${target.company_id}/${consultantId}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: `Não foi possível enviar a foto: ${uploadError.message}` };
  }

  const { data: publicUrlData } = admin.storage.from("avatars").getPublicUrl(path);
  // Cache-busting: o path é fixo (upsert sobrescreve), então sem isso o
  // browser mostraria a foto antiga em cache após reenviar.
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", consultantId);

  if (profileError) {
    return { error: `Não foi possível salvar a foto no perfil: ${profileError.message}` };
  }

  revalidatePath("/consultoras");
  revalidatePath("/dashboard");

  return { success: true, avatarUrl };
}
