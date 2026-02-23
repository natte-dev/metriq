import { z } from "zod";

export const visitaSchema = z.object({
  department_id: z.coerce.number().int().positive("Selecione um departamento"),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato deve ser YYYY-MM"),
  week_id: z.coerce.number().int().positive("Selecione uma semana"),
  status_id: z.coerce.number().int().positive("Selecione um status"),
  responsavel_id: z.coerce.number().int().positive().optional().nullable(),
  responsavel_text: z.string().max(200).optional().nullable(),
  responsavel_nome: z.string().max(200).optional().nullable(),
  responsavel_setor: z.string().max(200).optional().nullable(),
  responsavel_tempo: z.string().max(100).optional().nullable(),
  cliente_id: z.coerce.number().int().positive().optional().nullable(),
  cliente_text: z.string().max(200).optional().nullable(),
  cliente: z.string().max(200).optional().nullable(),
  data_agendada: z.coerce.date().optional().nullable(),
  data_realizada: z.coerce.date().optional().nullable(),
  ata_anexada: z.coerce.boolean().default(false),
  pendencias_criadas: z.coerce.boolean().default(false),
  pendencias_prazo: z.coerce.boolean().default(false),
  observacoes: z.string().optional().nullable(),
  generated_from_cronograma_id: z.coerce.number().int().optional().nullable(),
});

export const visitaUpdateSchema = visitaSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const visitaStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status_id: z.coerce.number().int().positive("Selecione um status"),
});

export type VisitaInput = z.infer<typeof visitaSchema>;
export type VisitaUpdateInput = z.infer<typeof visitaUpdateSchema>;
export type VisitaStatusInput = z.infer<typeof visitaStatusSchema>;
