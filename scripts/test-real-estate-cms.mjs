import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
process.loadEnvFile(".env.local");
const base = process.env.CMS_TEST_URL || "http://localhost:3003",
  db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ),
  ids = [];
let cookie = "";
async function request(path, body, method = "POST", auth = true) {
  const response = await fetch(base + path, {
    headers: {
      Origin: base,
      ...(auth ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body), method } : {}),
  });
  return { response, data: await response.json() };
}
async function patch(p, action, extra = {}) {
  const r = await request(
    `/api/real-estate/manage/${p.id}`,
    { action, revision: p.revision, content: p.draft, ...extra },
    "PATCH",
  );
  assert.equal(r.response.status, 200, JSON.stringify(r.data));
  return r.data.property;
}
async function upload(propertyId, kind, name, mime, buffer) {
  const prepared = await request("/api/real-estate/upload", {
    action: "prepare",
    propertyId,
    kind,
    name,
    mime,
    size: buffer.length,
  });
  assert.equal(prepared.response.status, 200, JSON.stringify(prepared.data));
  const response = await fetch(prepared.data.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": mime, "x-upsert": "false" },
    body: buffer,
  });
  assert.equal(response.status, 200, await response.text());
  return request("/api/real-estate/upload", {
    action: "complete",
    id: prepared.data.id,
  });
}
try {
  assert.equal(
    (await request("/api/real-estate/manage", undefined, "GET", false)).response
      .status,
    401,
  );
  const session = await fetch(base + "/api/admin/session", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ code: process.env.ADMIN_ACCESS_CODE || "1870" }),
  });
  assert.equal(session.status, 200);
  cookie = session.headers.get("set-cookie").split(";")[0];
  const created = await request("/api/real-estate/manage", {
    title: "TEST CMS — vérification temporaire",
  });
  assert.equal(created.response.status, 201, JSON.stringify(created.data));
  let p = created.data.property;
  ids.push(p.id);
  const slug = p.slug;
  assert.equal((await fetch(`${base}/fr/immobilier/${slug}`)).status, 404);
  assert.equal(
    (
      await request(
        `/api/real-estate/manage/${p.id}`,
        { action: "save", revision: p.revision, content: p.draft },
        "PATCH",
        false,
      )
    ).response.status,
    401,
  );
  const csrf = await fetch(`${base}/api/real-estate/manage/${p.id}`, {
    method: "PATCH",
    headers: {
      Cookie: cookie,
      Origin: "https://example.invalid",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "save",
      revision: p.revision,
      content: p.draft,
    }),
  });
  assert.equal(csrf.status, 403);
  const jpeg = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "#699bcc" },
  })
    .jpeg()
    .toBuffer();
  const image = await upload(p.id, "image", "test.jpg", "image/jpeg", jpeg);
  assert.equal(image.response.status, 200, JSON.stringify(image.data));
  const pdf = await PDFDocument.create();
  pdf.addPage([200, 200]);
  const doc = await upload(
    p.id,
    "document",
    "plan.pdf",
    "application/pdf",
    Buffer.from(await pdf.save()),
  );
  assert.equal(doc.response.status, 200, JSON.stringify(doc.data));
  const invalid = await upload(
    p.id,
    "document",
    "fake.pdf",
    "application/pdf",
    Buffer.from("not a pdf"),
  );
  assert.equal(invalid.response.status, 400);
  p.draft = {
    ...p.draft,
    title: "Titre de test publié",
    location: "Monthey · Test",
    description: "Description de test",
    area: "130 m²",
    exteriorArea: "25",
    plotArea: "518 m²",
    priceAmount: 123456,
    priceOnRequest: false,
    images: [image.data.media],
    documents: [{ ...doc.data.media, title: "Plan de test" }],
    facts: [{ label: "Étage", value: "2" }],
  };
  const saved = await patch(p, "save");
  assert.equal(saved.published, null);
  assert.equal(saved.slug, slug);
  assert.equal(saved.draft.area, "130 m²");
  assert.equal(saved.draft.exteriorArea, "25");
  assert.equal(saved.draft.plotArea, "518 m²");
  const privateMedia = await fetch(
    base + `/api/real-estate/media/${image.data.media.id}`,
  );
  assert.equal(privateMedia.status, 404);
  const conflict = await request(
    `/api/real-estate/manage/${p.id}`,
    { action: "save", revision: p.revision, content: p.draft },
    "PATCH",
  );
  assert.equal(conflict.response.status, 409);
  p = await patch(saved, "publish");
  assert.equal(p.published.title, "Titre de test publié");
  assert.equal(p.published.exteriorArea, "25");
  assert.equal(p.published.plotArea, "518 m²");
  assert.equal((await fetch(`${base}/fr/immobilier/${slug}`)).status, 200);
  const page = await (await fetch(`${base}/fr/immobilier/${slug}`)).text();
  for (const label of [
    "Surface habitable",
    "Surface extérieure",
    "Surface parcelle",
    "25 m²",
    "518 m²",
  ])
    assert.ok(page.includes(label), `Surface absente de la fiche : ${label}`);
  const webp = await fetch(
    base + `/api/real-estate/media/${image.data.media.id}`,
  );
  assert.equal(webp.status, 200);
  assert.match(webp.headers.get("content-type"), /image\/webp/);
  assert.equal(
    (await sharp(Buffer.from(await webp.arrayBuffer())).metadata()).format,
    "webp",
  );
  const pdfPublic = await fetch(
    base + `/api/real-estate/media/${doc.data.media.id}`,
  );
  assert.equal(pdfPublic.status, 200);
  assert.match(pdfPublic.headers.get("content-type"), /application\/pdf/);
  const revision = p.revision;
  p.draft = { ...p.draft, title: "Changement privé" };
  p = await patch(p, "save");
  assert.equal(p.published.title, "Titre de test publié");
  assert.equal(p.published.exteriorArea, "25");
  assert.equal(p.published.plotArea, "518 m²");
  const history = await request(`/api/real-estate/manage/${p.id}`);
  const original = history.data.versions.find((v) => v.revision === revision);
  assert.ok(original);
  p = await patch(p, "restore_version", { versionId: original.id });
  assert.equal(p.draft.title, "Titre de test publié");
  assert.equal(p.draft.exteriorArea, "25");
  assert.equal(p.draft.plotArea, "518 m²");
  p = await patch(p, "hide");
  assert.equal((await fetch(`${base}/fr/immobilier/${slug}`)).status, 404);
  assert.equal(
    (await fetch(base + `/api/real-estate/media/${image.data.media.id}`))
      .status,
    404,
  );
  p = await patch(p, "publish");
  p = await patch(p, "trash");
  assert.ok(p.deleted_at);
  assert.equal((await fetch(`${base}/fr/immobilier/${slug}`)).status, 404);
  p = await patch(p, "restore");
  assert.equal(p.deleted_at, null);
  assert.equal((await fetch(`${base}/fr/immobilier/${slug}`)).status, 200);
  const second = await request("/api/real-estate/manage", {
    title: "TEST CMS — propriété des fichiers",
  });
  ids.push(second.data.property.id);
  const foreign = await request(
    `/api/real-estate/manage/${second.data.property.id}`,
    {
      action: "save",
      revision: 1,
      content: { ...second.data.property.draft, images: [image.data.media] },
    },
    "PATCH",
  );
  assert.equal(foreign.response.status, 400);
  console.log(
    "CMS vérifié : authentification, CSRF, brouillon privé, WebP réel, PDF, validation, publication, conflit, historique, masquage, corbeille et restauration.",
  );
} finally {
  for (const id of ids) {
    const { data: assets } = await db
      .from("real_estate_assets")
      .select("path")
      .eq("property_id", id);
    if (assets?.length)
      await db.storage
        .from("real-estate-media")
        .remove(assets.map((a) => a.path));
    const { error } = await db
      .from("real_estate_properties")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
  console.log("Fixtures de test supprimées.");
}
