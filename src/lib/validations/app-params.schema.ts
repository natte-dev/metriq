import { z } from "zod";

export const appParamsSchema = z
  .object({
    meta_visitas_mes: z.coerce.number().int().min(0, "Deve ser >= 0"),
    escala_atendimento_max: z.coerce
      .number()
      .positive("Deve ser positivo")
      .max(100),
    peso_visitacao: z.coerce.number().min(0).max(1),
    peso_atendimento: z.coerce.number().min(0).max(1),
    peso_qualidade: z.coerce.number().min(0).max(1),
    bonus_trimestral: z.coerce.number().min(0),
    bonus_semestral: z.coerce.number().min(0),
    bonus_anual: z.coerce.number().min(0),
  })
  .refine(
    (d) => {
      const sum = d.peso_visitacao + d.peso_atendimento + d.peso_qualidade;
      return Math.abs(sum - 1.0) < 0.001;
    },
    {
      message: "Os pesos devem somar exatamente 1.0",
      path: ["peso_visitacao"],
    }
  );

export type AppParamsInput = z.infer<typeof appParamsSchema>;
