import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual, createHash } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body?.password ?? "");

    // Suporta MANAGER_PASSWORD_HASH (bcrypt) ou MANAGER_PASSWORD (texto puro)
    const envHash = process.env.MANAGER_PASSWORD_HASH;
    const envPlain = process.env.MANAGER_PASSWORD;

    let valid = false;

    if (envHash && envHash.startsWith("$2")) {
      // bcrypt hash — importar dinamicamente para evitar problemas com Turbopack
      const bcrypt = await import("bcryptjs");
      valid = await bcrypt.compare(password, envHash);
    } else if (envPlain) {
      // Fallback: comparação segura com texto puro
      const a = createHash("sha256").update(password).digest();
      const b = createHash("sha256").update(envPlain).digest();
      try {
        valid = timingSafeEqual(a, b);
      } catch {
        valid = false;
      }
    } else {
      return NextResponse.json(
        { error: "Senha de gerente não configurada" },
        { status: 500 }
      );
    }

    if (!valid) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("role", "manager", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.delete("coord_department_id");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/manager] erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
