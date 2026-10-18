import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/admin",
        "/api/dashboard",
        "/api/real-estate/manage",
        "/api/real-estate/upload",
      ],
    },
    sitemap: new URL("/sitemap.xml", getSiteUrl()).toString(),
  };
}
