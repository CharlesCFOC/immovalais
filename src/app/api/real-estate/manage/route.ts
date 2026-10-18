import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { guard, apiError } from "@/lib/real-estate/api";
import { emptyProperty } from "@/lib/real-estate/types";
export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const { data, error } = await getSupabaseAdminClient()
    .from("real_estate_properties")
    .select("id,slug,draft,visibility,revision,deleted_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) return apiError(new Error("Impossible de charger les biens."));
  return NextResponse.json(
    { properties: data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  const denied = await guard(request, true);
  if (denied) return denied;
  try {
    const input = await request.json();
    if (
      typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.length > 200
    )
      throw new Error("Indiquez un titre (200 caractères maximum).");
    const suffix = randomUUID().slice(0, 8),
      base =
        input.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 100) || "bien";
    const { data, error } = await getSupabaseAdminClient()
      .from("real_estate_properties")
      .insert({
        slug: `${base}-${suffix}`,
        draft: emptyProperty(input.title.trim()),
      })
      .select()
      .single();
    if (error) throw new Error("Création du bien impossible.");
    return NextResponse.json({ property: data }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
