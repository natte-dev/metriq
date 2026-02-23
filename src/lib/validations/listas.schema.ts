import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

export const monthSchema = z.object({
  value: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM")
    .refine((v) => {
      const month = parseInt(v.split("-")[1]);
      return month >= 1 && month <= 12;
    }, "Mês deve ser entre 01 e 12"),
});

export const statusVisitaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

export const semanaSchema = z.object({
  number: z.coerce.number().int().min(1).max(10),
});

export const notaSchema = z.object({
  value: z.coerce.number().int().min(1).max(10),
});

export const tipoErroSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  penalty_points: z.coerce.number().int().min(0, "Deve ser >= 0"),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type MonthInput = z.infer<typeof monthSchema>;
export type StatusVisitaInput = z.infer<typeof statusVisitaSchema>;
export type SemanaInput = z.infer<typeof semanaSchema>;
export type NotaInput = z.infer<typeof notaSchema>;
export type TipoErroInput = z.infer<typeof tipoErroSchema>;
