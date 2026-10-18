// Run once: node scripts/migrate-real-estate.mjs. Existing slugs are never overwritten.
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
process.loadEnvFile(".env.local");
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  bucket = "real-estate-media";
const seed = JSON.parse(
  await readFile(new URL("./real-estate-seed.json", import.meta.url), "utf8"),
);
for (const p of seed) {
  const { data: exists, error: readError } = await db
    .from("real_estate_properties")
    .select("id,published")
    .eq("slug", p.slug)
    .maybeSingle();
  if (readError) throw readError;
  if (exists?.published) {
    console.log(`Déjà importé : ${p.slug}`);
    continue;
  }
  const id = exists?.id || randomUUID();
  if (!exists) {
    const { error } = await db
      .from("real_estate_properties")
      .insert({ id, slug: p.slug, draft: p.content });
    if (error) throw error;
  }
  const content = structuredClone(p.content);
  for (const image of p.sourceImages) {
    const assetId = randomUUID(),
      path = `${id}/${assetId}.webp`;
    const file = await readFile(`public${image}`);
    const buffer = await sharp(file)
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
    const { error } = await db.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
      });
    if (error) throw error;
    const { error: assetError } = await db.from("real_estate_assets").insert({
      id: assetId,
      property_id: id,
      kind: "image",
      path,
      name: image
        .split("/")
        .at(-1)
        .replace(/\.[^.]+$/, ".webp"),
      mime: "image/webp",
      bytes: buffer.length,
      ready: true,
    });
    if (assetError) throw assetError;
    content.images.push({
      id: assetId,
      title: `Photo ${content.images.length + 1}`,
      alt: p.content.title,
    });
  }
  const { error } = await db
    .from("real_estate_properties")
    .update({ draft: content, published: content, visibility: "published" })
    .eq("id", id);
  if (error) throw error;
  const { error: versionError } = await db
    .from("real_estate_versions")
    .insert({ property_id: id, revision: 1, action: "import", content });
  if (versionError) throw versionError;
  console.log(`Importé : ${p.slug} (${content.images.length} photos WebP)`);
}
