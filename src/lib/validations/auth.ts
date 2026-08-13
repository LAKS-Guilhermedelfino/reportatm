import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
