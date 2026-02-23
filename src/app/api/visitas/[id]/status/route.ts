import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const visitaId = Number(id);

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;
  const coordDeptId = cookieStore.get("coord_department_id")?.value
    ? Number(cookieStore.get("coord_department_id")!.value)
    : null;

  if (!role || (role !== "manager" && role !== "coord")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { status_id } = await req.json();
  if (!status_id) {
    return NextResponse.json({ error: "status_id obrigatório" }, { status: 400 });
  }

  // For coord: validate that the visita belongs to their department
  if (role === "coord") {
    if (!coordDeptId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const visita = await prisma.visita.findUnique({
      where: { id: visitaId },
      select: { department_id: true },
    });
    if (!visita) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 });
    }
    if (visita.department_id !== coordDeptId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
  }

  try {
    await prisma.visita.update({
      where: { id: visitaId },
      data: { status_id: Number(status_id) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
