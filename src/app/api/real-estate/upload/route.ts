import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { guard, apiError } from "@/lib/real-estate/api";
import { MEDIA_BUCKET } from "@/lib/real-estate/server";
export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_BYTES = 25 * 1024 * 1024;
const allowed = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];
export async function POST(request: Request) {
  const denied = await guard(request, true);
  if (denied) return denied;
  try {
    const input = await request.json(),
      db = getSupabaseAdminClient();
    if (input.action === "prepare") {
      if (
        !["image", "document"].includes(input.kind) ||
        typeof input.name !== "string" ||
        !input.name ||
        input.name.length > 200 ||
        !Number.isSafeInteger(input.size) ||
        input.size <= 0 ||
        input.size > MAX_BYTES
      )
        throw new Error("Fichier invalide ou supérieur à 25 Mo.");
      if (
        (input.kind === "image" && !allowed.includes(input.mime)) ||
        (input.kind === "document" && input.mime !== "application/pdf")
      )
        throw new Error(
          "Importez une image JPEG, PNG, WebP, AVIF ou HEIC, ou un document PDF.",
        );
      const { data: property } = await db
        .from("real_estate_properties")
        .select("id")
        .eq("id", input.propertyId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!property) throw new Error("Bien introuvable.");
      const id = randomUUID(),
        path = `${property.id}/staging/${id}`;
      const { error: rowError } = await db.from("real_estate_assets").insert({
        id,
        property_id: property.id,
        kind: input.kind,
        path,
        name: input.name,
        mime: input.mime,
        bytes: input.size,
      });
      if (rowError) throw new Error("Préparation impossible.");
      const { data, error } = await db.storage
        .from(MEDIA_BUCKET)
        .createSignedUploadUrl(path);
      if (error || !data) {
        await db.from("real_estate_assets").delete().eq("id", id);
        throw new Error("Préparation du transfert impossible.");
      }
      return NextResponse.json({ id, signedUrl: data.signedUrl });
    }
    if (input.action === "cancel" && typeof input.id === "string") {
      const { data: pending } = await db
        .from("real_estate_assets")
        .select("id,path")
        .eq("id", input.id)
        .eq("ready", false)
        .maybeSingle();
      if (pending) {
        const { error } = await db.storage
          .from(MEDIA_BUCKET)
          .remove([pending.path]);
        if (error) throw new Error("Nettoyage du transfert impossible.");
        await db
          .from("real_estate_assets")
          .delete()
          .eq("id", pending.id)
          .eq("ready", false);
      }
      return NextResponse.json({ cancelled: true });
    }
    if (input.action !== "complete" || typeof input.id !== "string")
      throw new Error("Action invalide.");
    const { data: asset } = await db
      .from("real_estate_assets")
      .select("*")
      .eq("id", input.id)
      .single();
    if (!asset) throw new Error("Fichier introuvable.");
    if (asset.ready)
      return NextResponse.json({
        media: { id: asset.id, title: asset.name, alt: "" },
      });
    const { data: property } = await db
      .from("real_estate_properties")
      .select("id")
      .eq("id", asset.property_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!property) throw new Error("Ce bien est dans la corbeille.");
    const { data: file, error: downloadError } = await db.storage
      .from(MEDIA_BUCKET)
      .download(asset.path);
    if (downloadError || !file)
      throw new Error("Le transfert du fichier est incomplet. Réessayez.");
    let target = "";
    try {
      if (file.size > MAX_BYTES || file.size !== Number(asset.bytes))
        throw new Error("Taille du fichier invalide.");
      let buffer: Buffer = Buffer.from(await file.arrayBuffer());
      const mime = asset.kind === "image" ? "image/webp" : "application/pdf";
      if (asset.kind === "image") {
        try {
          buffer = await sharp(buffer, { limitInputPixels: 60000000 })
            .rotate()
            .resize({
              width: 2400,
              height: 2400,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85, effort: 5 })
            .toBuffer();
        } catch {
          throw new Error(
            "Image illisible ou format non pris en charge. Exportez-la en JPEG ou PNG.",
          );
        }
      } else {
        if (buffer.subarray(0, 5).toString() !== "%PDF-")
          throw new Error("Le document doit être un véritable PDF.");
        try {
          await PDFDocument.load(buffer, { updateMetadata: false });
        } catch {
          throw new Error(
            "PDF illisible ou protégé. Importez un PDF lisible sans mot de passe.",
          );
        }
      }
      target = `${asset.property_id}/${asset.id}.${asset.kind === "image" ? "webp" : "pdf"}`;
      const { error: uploadError } = await db.storage
        .from(MEDIA_BUCKET)
        .upload(target, buffer, {
          contentType: mime,
          upsert: true,
          cacheControl: "31536000",
        });
      if (uploadError) throw new Error("Enregistrement du fichier impossible.");
      const name =
        asset.kind === "image"
          ? asset.name.replace(/\.[^.]+$/, "") + ".webp"
          : asset.name;
      const { error: updateError } = await db
        .from("real_estate_assets")
        .update({ path: target, mime, bytes: buffer.length, ready: true, name })
        .eq("id", asset.id)
        .eq("ready", false);
      if (updateError)
        throw new Error(
          "Enregistrement des informations du fichier impossible.",
        );
      await db.storage.from(MEDIA_BUCKET).remove([asset.path]);
      return NextResponse.json({
        media: { id: asset.id, title: name, alt: "" },
      });
    } catch (e) {
      await db.storage
        .from(MEDIA_BUCKET)
        .remove([asset.path, ...(target ? [target] : [])]);
      await db
        .from("real_estate_assets")
        .delete()
        .eq("id", asset.id)
        .eq("ready", false);
      throw e;
    }
  } catch (e) {
    return apiError(e);
  }
}
