import { z } from "zod";

export const inviteConsultantSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  companyId: z.string().uuid(),
  startedAt: z.string().optional(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export type InviteConsultantInput = z.infer<typeof inviteConsultantSchema>;

export const updateConsultantSchema = z.object({
  consultantId: z.string().uuid(),
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  startedAt: z.string().optional(),
});

export type UpdateConsultantInput = z.infer<typeof updateConsultantSchema>;
