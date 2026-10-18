import type { MetadataRoute } from "next";
import { publicProperties } from "@/lib/real-estate/server";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const publicPaths = ["/immobilier", "/biens", "/vendre", "/commercialisation"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const urls: MetadataRoute.Sitemap = publicPaths.map((path) => {
    const pathname = `/fr${path}`;
    return {
      url: new URL(pathname, baseUrl).toString(),
      alternates: { languages: { fr: new URL(pathname, baseUrl).toString(), "x-default": new URL(pathname, baseUrl).toString() } },
    };
  });

  try {
    const properties = await publicProperties();
    for (const property of properties) {
      urls.push(
        {
          url: new URL(`/fr/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString(),
          alternates: {
            languages: {
              fr: new URL(`/fr/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString(),
              "x-default": new URL(`/fr/bien/${encodeURIComponent(property.slug)}`, baseUrl).toString(),
            },
          },
        },
      );
    }
  } catch {
    // Keep the main sitemap available if the listings database is temporarily unavailable.
  }

  return urls;
}
