import { z } from "zod";

export const cronogramaSchema = z.object({
  department_id: z.coerce.number().int().positive("Selecione um departamento"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM"),
  week_num: z.coerce.number().int().min(1).max(5),
  cliente_id: z.coerce.number().int().positive().optional().nullable(),
  cliente_text: z.string().max(200).optional().nullable(),
  data_agendada: z.coerce.date().optional().nullable(),
  responsavel_id: z.coerce.number().int().positive().optional().nullable(),
  responsavel_text: z.string().max(200).optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export const cronogramaUpdateSchema = cronogramaSchema.extend({
  id: z.coerce.number().int().positive(),
});

export type CronogramaInput = z.infer<typeof cronogramaSchema>;
export type CronogramaUpdateInput = z.infer<typeof cronogramaUpdateSchema>;
