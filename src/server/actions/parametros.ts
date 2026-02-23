"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { appParamsSchema } from "@/lib/validations/app-params.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getAppParams() {
  return prisma.appParams.findFirst();
}

export async function updateAppParams(input: unknown): Promise<ActionResult> {
  const parsed = appParamsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  try {
    const existing = await prisma.appParams.findFirst();
    if (existing) {
      await prisma.appParams.update({
        where: { id: existing.id },
        data: parsed.data,
      });
    } else {
      await prisma.appParams.create({ data: parsed.data });
    }
    revalidatePath("/parametros");
    revalidatePath("/score");
    revalidatePath("/ranking");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao salvar parâmetros." };
  }
}
