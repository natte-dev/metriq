import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { departmentId, password } = await req.json();

  if (!departmentId || !password) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const auth = await prisma.departmentAuth.findUnique({
    where: { department_id: Number(departmentId) },
  });

  if (!auth) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }

  const valid = await bcrypt.compare(String(password), auth.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("role", "coord", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  cookieStore.set("coord_department_id", String(departmentId), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
