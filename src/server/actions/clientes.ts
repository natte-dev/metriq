"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  empresa: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export async function listClientes(onlyActive = false) {
  return prisma.cliente.findMany({
    where: onlyActive ? { is_active: true } : undefined,
    orderBy: { nome: "asc" },
  });
}

export async function createCliente(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const record = await prisma.cliente.create({
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa ?? null,
        cnpj: parsed.data.cnpj ?? null,
        telefone: parsed.data.telefone ?? null,
        is_active: parsed.data.is_active ?? true,
      },
    });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar cliente." };
  }
}

export async function updateCliente(
  id: number,
  input: unknown
): Promise<ActionResult> {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    await prisma.cliente.update({
      where: { id },
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa ?? null,
        cnpj: parsed.data.cnpj ?? null,
        telefone: parsed.data.telefone ?? null,
        is_active: parsed.data.is_active ?? true,
      },
    });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar cliente." };
  }
}

export async function deleteCliente(id: number): Promise<ActionResult> {
  try {
    await prisma.cliente.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir cliente." };
  }
}
