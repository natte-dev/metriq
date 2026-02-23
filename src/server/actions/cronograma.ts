"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  cronogramaSchema,
  cronogramaUpdateSchema,
} from "@/lib/validations/cronograma.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listCronograma(filters?: {
  month?: string;
  department_id?: number;
}) {
  const where = {
    ...(filters?.month && { month: filters.month }),
    ...(filters?.department_id && { department_id: filters.department_id }),
  };

  return prisma.cronograma.findMany({
    where,
    include: {
      department: true,
      responsavel: true,
      cliente: true,
    },
    orderBy: [{ week_num: "asc" }, { department: { name: "asc" } }],
  });
}

export async function createCronograma(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = cronogramaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const statusPendente = await prisma.statusVisita.findFirst({
      where: { name: "Pendente" },
    });
    if (!statusPendente) {
      return {
        success: false,
        error: "Status 'Pendente' nao encontrado. Configure as listas primeiro.",
      };
    }

    const semana = await prisma.semana.findFirst({
      where: { number: parsed.data.week_num },
    });
    if (!semana) {
      return {
        success: false,
        error: `Semana ${parsed.data.week_num} nao encontrada. Configure as listas primeiro.`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const cronograma = await tx.cronograma.create({
        data: parsed.data,
      });

      await tx.visita.create({
        data: {
          department_id: parsed.data.department_id,
          month: parsed.data.month,
          week_id: semana.id,
          status_id: statusPendente.id,
          responsavel_id: parsed.data.responsavel_id ?? null,
          responsavel_text: parsed.data.responsavel_text ?? null,
          cliente_id: parsed.data.cliente_id ?? null,
          cliente_text: parsed.data.cliente_text ?? null,
          data_agendada: parsed.data.data_agendada ?? null,
          generated_from_cronograma_id: cronograma.id,
        },
      });

      return cronograma;
    });

    revalidatePath("/cronograma");
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");

    return { success: true, data: { id: result.id } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint")) {
      return {
        success: false,
        error: "Ja existe um item neste departamento/semana/mes.",
      };
    }
    return { success: false, error: "Erro ao criar item no cronograma." };
  }
}

export async function updateCronograma(input: unknown): Promise<ActionResult> {
  const parsed = cronogramaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, ...data } = parsed.data;

  try {
    const statusPendente = await prisma.statusVisita.findFirst({
      where: { name: "Pendente" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.cronograma.update({ where: { id }, data });

      if (statusPendente) {
        const visita = await tx.visita.findFirst({
          where: {
            generated_from_cronograma_id: id,
            status_id: statusPendente.id,
          },
        });
        if (visita) {
          await tx.visita.update({
            where: { id: visita.id },
            data: {
              responsavel_id: data.responsavel_id ?? null,
              responsavel_text: data.responsavel_text ?? null,
              cliente_id: data.cliente_id ?? null,
              cliente_text: data.cliente_text ?? null,
              data_agendada: data.data_agendada ?? null,
            },
          });
        }
      }
    });

    revalidatePath("/cronograma");
    revalidatePath("/visitas");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar cronograma." };
  }
}

export async function deleteCronograma(id: number): Promise<ActionResult> {
  try {
    const statusPendente = await prisma.statusVisita.findFirst({
      where: { name: "Pendente" },
    });

    await prisma.$transaction(async (tx) => {
      if (statusPendente) {
        await tx.visita.deleteMany({
          where: {
            generated_from_cronograma_id: id,
            status_id: statusPendente.id,
          },
        });
      }

      await tx.cronograma.delete({ where: { id } });
    });

    revalidatePath("/cronograma");
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir item do cronograma." };
  }
}
