import {
  normalizePropertyRow,
  normalizePropertyContent,
} from "@/lib/real-estate/types";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { guard, apiError } from "@/lib/real-estate/api";
import { validateContent, validateAssets } from "@/lib/real-estate/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  const { id } = await params,
    db = getSupabaseAdminClient();
  const [property, versions] = await Promise.all([
    db.from("real_estate_properties").select("*").eq("id", id).maybeSingle(),
    db
      .from("real_estate_versions")
      .select("id,revision,action,content,created_at")
      .eq("property_id", id)
      .order("revision", { ascending: false })
      .limit(50),
  ]);
  if (property.error || versions.error)
    return apiError(new Error("Chargement impossible."));
  if (!property.data)
    return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
  return NextResponse.json(
    {
      property: normalizePropertyRow(property.data),
      versions: versions.data?.map((v) => ({
        ...v,
        content: normalizePropertyContent(v.content),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function PATCH(request: Request, { params }: Context) {
  const denied = await guard(request, true);
  if (denied) return denied;
  try {
    const { id } = await params,
      input = await request.json(),
      db = getSupabaseAdminClient();
    const actions = [
      "save",
      "publish",
      "hide",
      "trash",
      "restore",
      "restore_version",
    ];
    if (
      !actions.includes(input.action) ||
      !Number.isSafeInteger(input.revision)
    )
      throw new Error("Action invalide.");
    let content = null;
    if (["save", "publish", "restore_version"].includes(input.action)) {
      let raw = input.content;
      if (input.action === "restore_version") {
        const { data, error } = await db
          .from("real_estate_versions")
          .select("content")
          .eq("id", input.versionId)
          .eq("property_id", id)
          .single();
        if (error || !data) throw new Error("Version introuvable.");
        raw = data.content;
      }
      content = validateContent(raw);
      await validateAssets(id, content);
      if (
        input.action === "publish" &&
        (!content.images.length || !content.location || !content.description)
      )
        throw new Error(
          "Ajoutez au minimum une photo, une localisation et une description avant de publier.",
        );
    }
    const { data, error } = await db.rpc("manage_real_estate_property", {
      p_id: id,
      p_revision: input.revision,
      p_action: input.action,
      p_content: content,
    });
    if (error)
      throw new Error(
        error.message.includes("CONFLICT")
          ? "CONFLICT"
          : "Enregistrement impossible.",
      );
    return NextResponse.json({ property: data });
  } catch (e) {
    return apiError(e);
  }
}
