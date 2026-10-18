import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSession, ADMIN_SESSION_COOKIE, hasAdminSession } from "@/lib/adminSession";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 86_400 };
export async function GET() {
  return NextResponse.json({ authorized: await hasAdminSession() }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  const expected = process.env.ADMIN_ACCESS_CODE?.trim();
  if (!expected) return NextResponse.json({ error: "Le code administrateur n’est pas configuré." }, { status: 503 });
  let code = "";
  try { const body = await request.json(); code = typeof body?.code === "string" ? body.code.trim() : ""; } catch {}
  const supplied = Buffer.from(code);
  const configured = Buffer.from(expected);
  if (supplied.length !== configured.length || !timingSafeEqual(supplied, configured)) return NextResponse.json({ error: "Code incorrect." }, { status: 401 });
  (await cookies()).set(ADMIN_SESSION_COOKIE, createAdminSession(), cookieOptions);
  return NextResponse.json({ authorized: true }, { headers: { "Cache-Control": "no-store" } });
}
export async function DELETE() {
  (await cookies()).set(ADMIN_SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return NextResponse.json({ authorized: false });
}
