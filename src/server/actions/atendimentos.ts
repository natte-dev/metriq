"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  atendimentoSchema,
  atendimentoUpdateSchema,
} from "@/lib/validations/atendimento.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listAtendimentos(filters?: {
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
    prisma.atendimento.findMany({
      where,
      include: { department: true, nota: true },
      orderBy: [{ month: "desc" }, { data: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.atendimento.count({ where }),
  ]);

  return { records, total, page: filters?.page ?? 1, limit };
}

export async function getAtendimentoStats(filters?: {
  department_id?: number;
  month?: string;
}) {
  const where = {
    ...(filters?.department_id && { department_id: filters.department_id }),
    ...(filters?.month && { month: filters.month }),
  };

  const records = await prisma.atendimento.findMany({
    where,
    include: { nota: true },
  });

  const total = records.length;
  const mediaNote =
    total > 0
      ? records.reduce((sum, r) => sum + r.nota.value, 0) / total
      : 0;

  return { total, mediaNote };
}

export async function createAtendimento(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = atendimentoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const record = await prisma.atendimento.create({ data: parsed.data });
    revalidatePath("/atendimento");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar atendimento." };
  }
}

export async function updateAtendimento(input: unknown): Promise<ActionResult> {
  const parsed = atendimentoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { id, ...data } = parsed.data;
  try {
    await prisma.atendimento.update({ where: { id }, data });
    revalidatePath("/atendimento");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar atendimento." };
  }
}

export async function deleteAtendimento(id: number): Promise<ActionResult> {
  try {
    await prisma.atendimento.delete({ where: { id } });
    revalidatePath("/atendimento");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir atendimento." };
  }
}
