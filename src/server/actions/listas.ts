"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  departmentSchema,
  monthSchema,
  statusVisitaSchema,
  semanaSchema,
  notaSchema,
  tipoErroSchema,
} from "@/lib/validations/listas.schema";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Departments ────────────────────────────────────────────────────────────

export async function listDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}

export async function createDepartment(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.department.create({ data: parsed.data });
    revalidatePath("/listas");
    revalidatePath("/visitas");
    revalidatePath("/atendimento");
    revalidatePath("/erros");
    revalidatePath("/cronograma");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar departamento." };
  }
}

export async function updateDepartment(
  id: number,
  input: unknown
): Promise<ActionResult> {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    await prisma.department.update({ where: { id }, data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar departamento." };
  }
}

export async function deleteDepartment(id: number): Promise<ActionResult> {
  try {
    const [visitas, atendimentos, erros, cronograma] = await Promise.all([
      prisma.visita.count({ where: { department_id: id } }),
      prisma.atendimento.count({ where: { department_id: id } }),
      prisma.erro.count({ where: { department_id: id } }),
      prisma.cronograma.count({ where: { department_id: id } }),
    ]);
    if (visitas + atendimentos + erros + cronograma > 0) {
      return {
        success: false,
        error:
          "Não é possível excluir: departamento possui registros vinculados.",
      };
    }
    await prisma.department.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir departamento." };
  }
}

// ─── Months ─────────────────────────────────────────────────────────────────

export async function listMonths() {
  return prisma.month.findMany({ orderBy: { value: "desc" } });
}

export async function createMonth(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = monthSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.month.create({ data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Mês já existe ou erro ao criar." };
  }
}

export async function deleteMonth(id: number): Promise<ActionResult> {
  try {
    await prisma.month.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir mês." };
  }
}

export async function generateNextMonths(count = 12): Promise<ActionResult<{ created: number }>> {
  try {
    const lastMonth = await prisma.month.findFirst({ orderBy: { value: "desc" } });
    let year: number;
    let month: number;

    if (lastMonth) {
      const [y, m] = lastMonth.value.split("-").map(Number);
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    let created = 0;
    for (let i = 1; i <= count; i++) {
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
      const value = `${year}-${String(month).padStart(2, "0")}`;
      try {
        await prisma.month.create({ data: { value } });
        created++;
      } catch {
        // skip duplicates
      }
    }

    revalidatePath("/listas");
    return { success: true, data: { created } };
  } catch {
    return { success: false, error: "Erro ao gerar meses." };
  }
}

// ─── Status Visita ───────────────────────────────────────────────────────────

export async function listStatusVisita() {
  return prisma.statusVisita.findMany({ orderBy: { name: "asc" } });
}

export async function createStatusVisita(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = statusVisitaSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.statusVisita.create({ data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar status." };
  }
}

export async function updateStatusVisita(
  id: number,
  input: unknown
): Promise<ActionResult> {
  const parsed = statusVisitaSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    await prisma.statusVisita.update({ where: { id }, data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar status." };
  }
}

export async function deleteStatusVisita(id: number): Promise<ActionResult> {
  try {
    const count = await prisma.visita.count({ where: { status_id: id } });
    if (count > 0) {
      return {
        success: false,
        error: "Não é possível excluir: status possui visitas vinculadas.",
      };
    }
    await prisma.statusVisita.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir status." };
  }
}

// ─── Semanas ────────────────────────────────────────────────────────────────

export async function listSemanas() {
  return prisma.semana.findMany({ orderBy: { number: "asc" } });
}

export async function createSemana(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = semanaSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.semana.create({ data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar semana." };
  }
}

export async function deleteSemana(id: number): Promise<ActionResult> {
  try {
    const count = await prisma.visita.count({ where: { week_id: id } });
    if (count > 0) {
      return {
        success: false,
        error: "Não é possível excluir: semana possui visitas vinculadas.",
      };
    }
    await prisma.semana.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir semana." };
  }
}

// ─── Notas ──────────────────────────────────────────────────────────────────

export async function listNotas() {
  return prisma.nota.findMany({ orderBy: { value: "asc" } });
}

export async function createNota(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = notaSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.nota.create({ data: parsed.data });
    revalidatePath("/listas");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar nota." };
  }
}

export async function deleteNota(id: number): Promise<ActionResult> {
  try {
    const count = await prisma.atendimento.count({ where: { nota_id: id } });
    if (count > 0) {
      return {
        success: false,
        error: "Não é possível excluir: nota possui atendimentos vinculados.",
      };
    }
    await prisma.nota.delete({ where: { id } });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir nota." };
  }
}

// ─── Tipo Erro ───────────────────────────────────────────────────────────────

export async function listTipoErro() {
  return prisma.tipoErro.findMany({ orderBy: { penalty_points: "asc" } });
}

export async function createTipoErro(
  input: unknown
): Promise<ActionResult<{ id: number }>> {
  const parsed = tipoErroSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const record = await prisma.tipoErro.create({ data: parsed.data });
    revalidatePath("/listas");
    revalidatePath("/parametros");
    return { success: true, data: { id: record.id } };
  } catch {
    return { success: false, error: "Erro ao criar tipo de erro." };
  }
}

export async function updateTipoErro(
  id: number,
  input: unknown
): Promise<ActionResult> {
  const parsed = tipoErroSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    await prisma.tipoErro.update({ where: { id }, data: parsed.data });
    revalidatePath("/listas");
    revalidatePath("/parametros");
    revalidatePath("/score");
    revalidatePath("/ranking");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao atualizar tipo de erro." };
  }
}

export async function deleteTipoErro(id: number): Promise<ActionResult> {
  try {
    const count = await prisma.erro.count({ where: { tipo_erro_id: id } });
    if (count > 0) {
      return {
        success: false,
        error: "Não é possível excluir: tipo de erro possui registros vinculados.",
      };
    }
    await prisma.tipoErro.delete({ where: { id } });
    revalidatePath("/listas");
    revalidatePath("/parametros");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao excluir tipo de erro." };
  }
}

// ─── Department Passwords ─────────────────────────────────────────────────────

export async function listDepartmentPasswords() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { department_auth: { select: { updated_at: true } } },
  });
  return departments.map((d) => ({
    id: d.id,
    name: d.name,
    hasPassword: !!d.department_auth,
    updatedAt: d.department_auth?.updated_at ?? null,
  }));
}

export async function setDepartmentPassword(
  departmentId: number,
  password: string
): Promise<ActionResult> {
  if (!password || password.length < 4) {
    return { success: false, error: "Senha deve ter no mínimo 4 caracteres." };
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await prisma.departmentAuth.upsert({
      where: { department_id: departmentId },
      create: { department_id: departmentId, password_hash: hash },
      update: { password_hash: hash },
    });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao definir senha do departamento." };
  }
}

export async function removeDepartmentPassword(
  departmentId: number
): Promise<ActionResult> {
  try {
    await prisma.departmentAuth.delete({
      where: { department_id: departmentId },
    });
    revalidatePath("/listas");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Erro ao remover senha." };
  }
}
