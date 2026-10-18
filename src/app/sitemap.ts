import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n";
import { publicProperties } from "@/lib/real-estate/server";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const publicPaths = ["/immobilier", "/biens", "/vendre", "/commercialisation"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const urls: MetadataRoute.Sitemap = publicPaths.flatMap((path) =>
    LOCALES.map((locale) => {
      const pathname = `/${locale}${path}`;
      return {
        url: new URL(pathname, baseUrl).toString(),
        alternates: {
          languages: Object.fromEntries(
            [...LOCALES.map((language) => [language, new URL(`/${language}${path}`, baseUrl).toString()] as const), ["x-default", new URL(`/fr${path}`, baseUrl).toString()] as const],
          ),
        },
      };
    }),
  );

  try {
    const properties = await publicProperties();
    for (const property of properties) {
      urls.push(
        ...LOCALES.map((locale) => ({
          url: new URL(`/${locale}/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString(),
          alternates: {
            languages: Object.fromEntries(
              [...LOCALES.map((language) => [language, new URL(`/${language}/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString()] as const), ["x-default", new URL(`/fr/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString()] as const],
            ),
          },
        })),
      );
    }
  } catch {
    // Keep the main sitemap available if the listings database is temporarily unavailable.
  }

  return urls;
}
