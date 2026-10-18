import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
export async function guard(request: Request, mutate = false) {
  if (!(await hasAdminSession()))
    return NextResponse.json(
      { error: "Accès administrateur requis." },
      { status: 401 },
    );
  if (mutate && request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Origine invalide." }, { status: 403 });
  return null;
}
export function apiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Une erreur est survenue.";
  return NextResponse.json(
    { error: message },
    { status: message === "CONFLICT" ? 409 : 400 },
  );
}
