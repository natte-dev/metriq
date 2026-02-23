"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  visitaSchema,
  visitaUpdateSchema,
  visitaStatusSchema,
} from "@/lib/validations/visita.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listVisitas(filters?: {
  department_id?: number;
  month?: string;
  status_id?: number;
  page?: number;
  limit?: number;
}) {
  const limit = filters?.limit ?? 20;
  const offset = ((filters?.page ?? 1) - 1) * limit;

  const where = {
    ...(filters?.department_id && { department_id: filters.department_id }),
    ...(filters?.month && { month: filters.month }),
    ...(filters?.status_id && { status_id: filters.status_id }),
  };

  const [records, total] = await Promise.all([
    prisma.visita.findMany({
      where,
      include: {
        department: true,
        semana: true,
        status: true,
        responsavel_rel: true,
        cliente_rel: true,
      },
      orderBy: [{ month: "desc" }, { data_agendada: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.visita.count({ where }),
  ]);

  return { records, total, page: filters?.page ?? 1, limit };
}

export async function getVisita(id: number) {
  return prisma.visita.findUnique({
    where: { id },
    include: {
      department: true,
      semana: true,
      status: true,
      responsavel_rel: true,
      cliente_rel: true,
    },
  });
}

export async function createVisita(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = visitaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const record = await prisma.visita.create({ data: parsed.data });
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar visita." };
  }
}

export async function updateVisita(input: unknown): Promise<ActionResult> {
  const parsed = visitaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, ...data } = parsed.data;
  try {
    await prisma.visita.update({ where: { id }, data });
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar visita." };
  }
}

export async function deleteVisita(id: number): Promise<ActionResult> {
  try {
    await prisma.visita.delete({ where: { id } });
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir visita." };
  }
}

export async function updateVisitaStatus(input: unknown): Promise<ActionResult> {
  const parsed = visitaStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, status_id } = parsed.data;
  try {
    await prisma.visita.update({ where: { id }, data: { status_id } });
    revalidatePath("/visitas");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar status da visita." };
  }
}
