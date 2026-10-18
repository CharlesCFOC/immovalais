import type { Metadata } from "next";

import { RealEstateProjectWorkspace } from "@/components/RealEstateProjectWorkspace";
import { propertyBySlug } from "@/lib/real-estate/server";
import { hasAdminSession } from "@/lib/adminSession";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
import { getLanguageAlternates, withLocalePath } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
import { toAbsoluteUrl } from "@/lib/siteUrl";

type ProjectPageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { locale, projectId } = await params.then(
    async ({ locale: rawLocale, projectId: rawProjectId }) => ({
      locale: await resolveLocaleParam(Promise.resolve({ locale: rawLocale })),
      projectId: rawProjectId,
    }),
  );
  const property = await propertyBySlug(projectId);
  const visible = property?.visibility === "published" && !property.deleted_at;
  const title = visible ? property.published?.title : "Bien immobilier";
  const description = visible
    ? property.published?.description.slice(0, 160)
    : "";
  const pathname = `/bien/${projectId}`;

  return {
    title,
    description,
    robots: { index: !!visible, follow: !!visible },
    alternates: {
      canonical: withLocalePath(locale, pathname),
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url: withLocalePath(locale, pathname),
      locale: locale === "fr" ? "fr_CH" : "en_CH",
      type: "website",
      images: [
        {
          url: toAbsoluteUrl(
            visible && property.published?.images[0]
              ? `/api/real-estate/media/${property.published.images[0].id}`
              : "/immobilier/monthey/vue-1.webp",
          ),
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        toAbsoluteUrl(
          visible && property.published?.images[0]
            ? `/api/real-estate/media/${property.published.images[0].id}`
            : "/immobilier/monthey/vue-1.webp",
        ),
      ],
    },
  };
}

export default async function RealEstateProjectPage({
  params,
  searchParams,
}: ProjectPageProps & { searchParams: Promise<{ edit?: string }> }) {
  const { locale, projectId } = await params;
  const resolvedLocale = await resolveLocaleParam(Promise.resolve({ locale }));
  const [property, authorized, query] = await Promise.all([
    propertyBySlug(projectId),
    hasAdminSession(),
    searchParams,
  ]);
  if (!property || property.deleted_at) notFound();
  const isPublic = property.visibility === "published" && property.published;
  if (!isPublic && !authorized) notFound();
  const startEditing = authorized && query.edit === "1";
  const initialContent =
    startEditing || !isPublic ? property.draft : property.published!;
  const propertyUrl = toAbsoluteUrl(`/${resolvedLocale}/bien/${encodeURIComponent(property.slug)}`);
  const structuredData = isPublic
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: resolvedLocale === "fr" ? "Accueil" : "Home", item: toAbsoluteUrl(`/${resolvedLocale}/immobilier`) },
          { "@type": "ListItem", position: 2, name: resolvedLocale === "fr" ? "Biens immobiliers" : "Properties", item: toAbsoluteUrl(`/${resolvedLocale}/biens`) },
          { "@type": "ListItem", position: 3, name: initialContent.title, item: propertyUrl },
        ],
      }
    : null;
  return (
    <>
      {structuredData ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /> : null}
      <RealEstateProjectWorkspace
        locale={resolvedLocale}
        slug={property.slug}
        propertyId={property.id}
        initialContent={initialContent}
        initialPublished={isPublic ? property.published : null}
        startEditing={startEditing}
      />
    </>
  );
}
