import { z } from "zod";

export const inviteConsultantSchema = z.object({
  fullName: z.string().trim().min(2, "Informe o nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  companyId: z.string().uuid(),
  startedAt: z.string().optional(),
});

export type InviteConsultantInput = z.infer<typeof inviteConsultantSchema>;
