import { z } from "zod";

/** Só admin pode convidar nestes dois papéis — nunca "consultora" por aqui (isso é /consultoras). */
export const inviteAdminUserSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  companyId: z.string().uuid(),
  role: z.enum(["admin", "gestora"]),
});

export type InviteAdminUserInput = z.infer<typeof inviteAdminUserSchema>;
