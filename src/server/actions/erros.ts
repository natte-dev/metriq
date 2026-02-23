"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  erroSchema,
  erroUpdateSchema,
} from "@/lib/validations/erro.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listErros(filters?: {
  department_id?: number;
  month?: string;
  page?: number;
  limit?: number;
}) {
  const limit = filters?.limit ?? 20;
  const offset = ((filters?.page ?? 1) - 1) * limit;

  const where = {
    ...(filters?.department_id && { department_id: filters.department_id }),
    ...(filters?.month && { month: filters.month }),
  };

  const [records, total] = await Promise.all([
    prisma.erro.findMany({
      where,
      include: { department: true, tipo_erro: true },
      orderBy: [{ month: "desc" }, { data: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.erro.count({ where }),
  ]);

  return { records, total, page: filters?.page ?? 1, limit };
}

export async function getErrosPenalidades(filters?: {
  department_id?: number;
  month?: string;
}): Promise<number> {
  const where = {
    ...(filters?.department_id && { department_id: filters.department_id }),
    ...(filters?.month && { month: filters.month }),
  };

  const records = await prisma.erro.findMany({
    where,
    include: { tipo_erro: true },
  });

  return records.reduce((sum, r) => {
    const pts =
      r.penalty_points_override != null
        ? r.penalty_points_override
        : r.tipo_erro.penalty_points;
    return sum + pts;
  }, 0);
}

export async function createErro(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = erroSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const record = await prisma.erro.create({ data: parsed.data });
    revalidatePath("/erros");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar registro de erro." };
  }
}

export async function updateErro(input: unknown): Promise<ActionResult> {
  const parsed = erroUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, ...data } = parsed.data;
  try {
    await prisma.erro.update({ where: { id }, data });
    revalidatePath("/erros");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar registro." };
  }
}

export async function deleteErro(id: number): Promise<ActionResult> {
  try {
    await prisma.erro.delete({ where: { id } });
    revalidatePath("/erros");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir registro." };
  }
}
