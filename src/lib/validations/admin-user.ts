import { z } from "zod";

/**
 * Só admin pode criar nestes dois papéis — nunca "consultora" por aqui
 * (isso é /consultoras). Cria com senha definida na hora em vez de convite
 * por e-mail: o serviço de e-mail padrão do Supabase tem rate limit baixo
 * (pendência conhecida, ver README) — aqui o admin escolhe a senha e
 * compartilha com a pessoa por fora (WhatsApp etc.), sem depender de e-mail.
 */
export const inviteAdminUserSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  companyId: z.string().uuid(),
  role: z.enum(["admin", "gestora"]),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type InviteAdminUserInput = z.infer<typeof inviteAdminUserSchema>;
