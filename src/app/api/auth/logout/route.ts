import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("role");
  cookieStore.delete("coord_department_id");
  return NextResponse.json({ ok: true });
}
