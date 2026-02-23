"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const responsavelSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  setor: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function listResponsaveis(onlyActive = false) {
  return prisma.responsavel.findMany({
    where: onlyActive ? { is_active: true } : undefined,
    orderBy: { nome: "asc" },
  });
}

export async function createResponsavel(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = responsavelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const record = await prisma.responsavel.create({
      data: {
        nome: parsed.data.nome,
        setor: parsed.data.setor ?? null,
        is_active: parsed.data.is_active ?? true,
      },
    });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar responsável." };
  }
}

export async function updateResponsavel(
  id: number,
  input: unknown
): Promise<ActionResult> {
  const parsed = responsavelSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.responsavel.update({
      where: { id },
      data: {
        nome: parsed.data.nome,
        setor: parsed.data.setor ?? null,
        is_active: parsed.data.is_active ?? true,
      },
    });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar responsável." };
  }
}

export async function deleteResponsavel(id: number): Promise<ActionResult> {
  try {
    await prisma.responsavel.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir responsável." };
  }
}
