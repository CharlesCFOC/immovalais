import "server-only";
import { cache } from "react";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  emptyProperty,
  normalizePropertyContent,
  normalizePropertyRow,
  propertyCategories,
  type PropertyContent,
  type PropertyRow,
} from "./types";
export const MEDIA_BUCKET = "real-estate-media";
export async function publicProperties() {
  const { data, error } = await getSupabaseAdminClient()
    .from("real_estate_properties")
    .select("slug,published")
    .eq("visibility", "published")
    .is("deleted_at", null);
  if (error) throw new Error("Impossible de charger les biens.");
  return (data as { slug: string; published: PropertyContent }[])
    .map((p) => ({ ...p, published: normalizePropertyContent(p.published) }))
    .sort(
      (a, b) =>
        Number(b.published.featured) - Number(a.published.featured) ||
        a.published.sortOrder - b.published.sortOrder,
    );
}
export const propertyBySlug = cache(async (slug: string) => {
  const { data, error } = await getSupabaseAdminClient()
    .from("real_estate_properties")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le bien.");
  return data ? normalizePropertyRow(data as PropertyRow) : null;
});
export function validateContent(input: unknown): PropertyContent {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Contenu invalide.");
  const supplied = input as Record<string, unknown>;
  const raw: Record<string, unknown> = {
      ...supplied,
      exteriorArea:
        supplied.exteriorArea === undefined ? "" : supplied.exteriorArea,
      plotArea: supplied.plotArea === undefined ? "" : supplied.plotArea,
    },
    p = emptyProperty();
  for (const key of Object.keys(p) as (keyof PropertyContent)[]) {
    const value = raw[key];
    if (typeof p[key] === "string") {
      if (
        typeof value !== "string" ||
        value.length >
          (key === "description" || key === "parcelText" ? 20000 : 2000)
      )
        throw new Error(`Champ invalide : ${key}.`);
      Object.assign(p, { [key]: value.trim() });
    } else if (typeof p[key] === "boolean") {
      if (typeof value !== "boolean")
        throw new Error(`Champ invalide : ${key}.`);
      Object.assign(p, { [key]: value });
    }
  }
  if (
    !p.title ||
    !propertyCategories.includes(p.category) ||
    !["CHF", "EUR", "USD"].includes(p.currency)
  )
    throw new Error("Titre, catégorie ou devise invalide.");
  if (
    raw.priceAmount !== null &&
    (typeof raw.priceAmount !== "number" ||
      !Number.isFinite(raw.priceAmount) ||
      raw.priceAmount < 0 ||
      raw.priceAmount > 1e12)
  )
    throw new Error("Prix invalide.");
  p.priceAmount = raw.priceAmount as number | null;
  if (!p.priceOnRequest && p.priceAmount === null)
    throw new Error("Indiquez un prix ou choisissez « Prix sur demande ».");
  if (
    typeof raw.sortOrder !== "number" ||
    !Number.isSafeInteger(raw.sortOrder) ||
    Math.abs(raw.sortOrder) > 100000
  )
    throw new Error("Ordre invalide.");
  p.sortOrder = raw.sortOrder;
  for (const key of ["images", "documents"] as const) {
    const items = raw[key];
    if (!Array.isArray(items) || items.length > 100)
      throw new Error("Maximum 100 fichiers par rubrique.");
    p[key] = items.map((item) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !/^[0-9a-f-]{36}$/i.test(item.id) ||
        typeof item.title !== "string" ||
        item.title.length > 200 ||
        typeof item.alt !== "string" ||
        item.alt.length > 500
      )
        throw new Error("Fichier invalide.");
      return { id: item.id, title: item.title.trim(), alt: item.alt.trim() };
    });
    if (new Set(p[key].map((m) => m.id)).size !== p[key].length)
      throw new Error("Un fichier apparaît plusieurs fois.");
  }
  if (!Array.isArray(raw.facts) || raw.facts.length > 100)
    throw new Error("Caractéristiques invalides.");
  p.facts = raw.facts.map((f) => {
    if (
      !f ||
      typeof f.label !== "string" ||
      !f.label.trim() ||
      f.label.length > 200 ||
      typeof f.value !== "string" ||
      f.value.length > 2000
    )
      throw new Error("Caractéristique invalide.");
    return { label: f.label.trim(), value: f.value.trim() };
  });
  return p;
}
export async function validateAssets(propertyId: string, p: PropertyContent) {
  const ids = [...p.images, ...p.documents].map((m) => m.id);
  if (!ids.length) return;
  const { data, error } = await getSupabaseAdminClient()
    .from("real_estate_assets")
    .select("id,kind")
    .eq("property_id", propertyId)
    .eq("ready", true)
    .in("id", ids);
  if (
    error ||
    data?.length !== ids.length ||
    p.images.some(
      (m) => !data.find((a) => a.id === m.id && a.kind === "image"),
    ) ||
    p.documents.some(
      (m) => !data.find((a) => a.id === m.id && a.kind === "document"),
    )
  )
    throw new Error(
      "Les fichiers doivent appartenir à ce bien et avoir terminé leur importation.",
    );
}
