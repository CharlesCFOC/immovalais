export const propertyCategories = [
  "Appartement",
  "Maison & villa",
  "Chalet",
  "Projet neuf",
  "Terrain",
  "Raccard & mayen",
  "Immeuble locatif",
  "À rénover",
] as const;
export type PropertyCategory = (typeof propertyCategories)[number];
export type PropertyMedia = { id: string; title: string; alt: string };
export type PropertyContent = {
  title: string;
  category: PropertyCategory;
  location: string;
  status: string;
  rooms: string;
  area: string;
  exteriorArea: string;
  plotArea: string;
  exterior: string;
  description: string;
  priceAmount: number | null;
  currency: string;
  priceOnRequest: boolean;
  availability: string;
  featured: boolean;
  sortOrder: number;
  images: PropertyMedia[];
  documents: PropertyMedia[];
  facts: { label: string; value: string }[];
  descriptionTitle: string;
  factsTitle: string;
  parcelTitle: string;
  parcelText: string;
  documentsTitle: string;
  contactTitle: string;
  contactText: string;
  showParcel: boolean;
  showDocuments: boolean;
  showContact: boolean;
};
export type PropertyRow = {
  id: string;
  slug: string;
  draft: PropertyContent;
  published: PropertyContent | null;
  visibility: "draft" | "published" | "hidden";
  revision: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
export type PropertyVersion = {
  id: string;
  revision: number;
  action: string;
  content: PropertyContent;
  created_at: string;
};
export const mediaUrl = (id: string) => `/api/real-estate/media/${id}`;
export function propertyPrice(p: PropertyContent) {
  return p.priceOnRequest || p.priceAmount === null
    ? "Prix sur demande"
    : `${p.currency} ${new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 2 }).format(p.priceAmount)}`;
}
export function emptyProperty(title = "Nouveau bien"): PropertyContent {
  return {
    title,
    category: "Appartement",
    location: "",
    status: "À vendre",
    rooms: "",
    area: "",
    exteriorArea: "",
    plotArea: "",
    exterior: "",
    description: "",
    priceAmount: null,
    currency: "CHF",
    priceOnRequest: true,
    availability: "À convenir",
    featured: false,
    sortOrder: 0,
    images: [],
    documents: [],
    facts: [],
    descriptionTitle: "Présentation du bien",
    factsTitle: "Caractéristiques",
    parcelTitle: "Informations de la parcelle",
    parcelText: "",
    documentsTitle: "Documents",
    contactTitle: "Visiter ce bien",
    contactText: "Planifiez une visite et découvrez cette propriété.",
    showParcel: true,
    showDocuments: true,
    showContact: true,
  };
}
// Earlier saved fiches and history entries do not yet contain the new surfaces.
export function normalizePropertyContent(p: PropertyContent): PropertyContent {
  return {
    ...p,
    exteriorArea: p.exteriorArea ?? "",
    plotArea: p.plotArea ?? "",
  };
}
export function normalizePropertyRow(p: PropertyRow): PropertyRow {
  return {
    ...p,
    draft: normalizePropertyContent(p.draft),
    published: p.published ? normalizePropertyContent(p.published) : null,
  };
}
function surfaceDisplay(value: string) {
  const text = value.trim();
  return /^[0-9][0-9\s.,’']*$/.test(text) ? `${text} m²` : text;
}
export function publicProperty(slug: string, content: PropertyContent) {
  const normalized = normalizePropertyContent(content);
  const p = {
    ...normalized,
    area: surfaceDisplay(normalized.area),
    exteriorArea: surfaceDisplay(normalized.exteriorArea),
    plotArea: surfaceDisplay(normalized.plotArea),
  };
  const price = propertyPrice(p),
    image = p.images[0]
      ? mediaUrl(p.images[0].id)
      : "/immobilier/placeholder.svg";
  return {
    ...p,
    id: slug,
    price,
    image,
    images: p.images.map((m) => mediaUrl(m.id)),
    imageAlts: p.images.map((m) => m.alt || p.title),
    imageCaptions: p.images.map((m) => m.title),
    documents: p.documents.map((m) => ({
      title: m.title,
      type: "PDF",
      href: mediaUrl(m.id),
    })),
    href: "",
    facts: [
      { label: "Type de bien", value: p.category },
      { label: "Pièces", value: p.rooms },
      { label: "Surface habitable", value: p.area || "Non renseignée" },
      {
        label: "Surface extérieure",
        value: p.exteriorArea || "Non renseignée",
      },
      { label: "Surface parcelle", value: p.plotArea || "Non renseignée" },
      { label: "Extérieur / stationnement", value: p.exterior },
      { label: "Disponibilité", value: p.availability },
      ...p.facts,
    ],
  };
}
export type PublicProperty = ReturnType<typeof publicProperty>;
