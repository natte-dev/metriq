import { z } from "zod";

export const atendimentoSchema = z.object({
  department_id: z.coerce.number().int().positive("Selecione um departamento"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM"),
  responsavel_id: z.coerce.number().int().positive().optional().nullable(),
  responsavel_text: z.string().max(200).optional().nullable(),
  responsavel: z.string().max(200).optional().nullable(),
  cliente_id: z.coerce.number().int().positive().optional().nullable(),
  cliente_text: z.string().max(200).optional().nullable(),
  cliente: z.string().max(200).optional().nullable(),
  data: z.coerce.date().optional().nullable(),
  nota_id: z.coerce.number().int().positive("Selecione uma nota"),
  sla_prazo: z.coerce.boolean().default(true),
  comentario: z.string().optional().nullable(),
});

export const atendimentoUpdateSchema = atendimentoSchema.extend({
  id: z.coerce.number().int().positive(),
});

export type AtendimentoInput = z.infer<typeof atendimentoSchema>;
export type AtendimentoUpdateInput = z.infer<typeof atendimentoUpdateSchema>;
