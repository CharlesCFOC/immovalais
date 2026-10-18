import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return [
      { source: "/fr/immobilier/biens", destination: "/fr/biens", permanent: true },
      { source: "/en/immobilier/biens", destination: "/en/biens", permanent: true },
      { source: "/fr/immobilier/vendre", destination: "/fr/vendre", permanent: true },
      { source: "/en/immobilier/vendre", destination: "/en/vendre", permanent: true },
      { source: "/fr/immobilier/commercialisation", destination: "/fr/commercialisation", permanent: true },
      { source: "/en/immobilier/commercialisation", destination: "/en/commercialisation", permanent: true },
      { source: "/fr/immobilier/:projectId", destination: "/fr/bien/:projectId", permanent: true },
      { source: "/en/immobilier/:projectId", destination: "/en/bien/:projectId", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/fr/biens", destination: "/fr/immobilier/biens" },
      { source: "/en/biens", destination: "/en/immobilier/biens" },
      { source: "/fr/vendre", destination: "/fr/immobilier/vendre" },
      { source: "/en/vendre", destination: "/en/immobilier/vendre" },
      { source: "/fr/commercialisation", destination: "/fr/immobilier/commercialisation" },
      { source: "/en/commercialisation", destination: "/en/immobilier/commercialisation" },
      { source: "/fr/bien/:projectId", destination: "/fr/immobilier/:projectId" },
      { source: "/en/bien/:projectId", destination: "/en/immobilier/:projectId" },
    ];
  },
};

export default nextConfig;
