import { z } from "zod";

export const businessDaysSchema = z.object({
  weekdayMask: z.coerce.number().int().min(0).max(127),
});

export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  description: z.string().trim().max(200).optional(),
});

export const companyNameSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa."),
});
