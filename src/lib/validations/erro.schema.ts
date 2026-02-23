import { z } from "zod";

export const erroSchema = z.object({
  department_id: z.coerce.number().int().positive("Selecione um departamento"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM"),
  responsavel_id: z.coerce.number().int().positive().optional().nullable(),
  responsavel_text: z.string().max(200).optional().nullable(),
  responsavel: z.string().max(200).optional().nullable(),
  cliente_id: z.coerce.number().int().positive().optional().nullable(),
  cliente_text: z.string().max(200).optional().nullable(),
  cliente: z.string().max(200).optional().nullable(),
  data: z.coerce.date().optional().nullable(),
  tipo_erro_id: z.coerce.number().int().positive("Selecione um tipo de erro"),
  penalty_points_override: z.coerce.number().int().min(0).optional().nullable(),
  descricao: z.string().optional().nullable(),
});

export const erroUpdateSchema = erroSchema.extend({
  id: z.coerce.number().int().positive(),
});

export type ErroInput = z.infer<typeof erroSchema>;
export type ErroUpdateInput = z.infer<typeof erroUpdateSchema>;
