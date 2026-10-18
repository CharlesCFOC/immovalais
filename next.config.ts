import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return [
      { source: "/fr/immobilier/biens", destination: "/fr/biens", permanent: true },
      { source: "/fr/immobilier/vendre", destination: "/fr/vendre", permanent: true },
      { source: "/fr/immobilier/commercialisation", destination: "/fr/commercialisation", permanent: true },
      { source: "/fr/immobilier/:projectId", destination: "/fr/bien/:projectId", permanent: true },
      { source: "/en", destination: "/fr/immobilier", permanent: true },
      { source: "/en/immobilier/biens", destination: "/fr/biens", permanent: true },
      { source: "/en/immobilier/vendre", destination: "/fr/vendre", permanent: true },
      { source: "/en/immobilier/commercialisation", destination: "/fr/commercialisation", permanent: true },
      { source: "/en/immobilier/:projectId", destination: "/fr/bien/:projectId", permanent: true },
      { source: "/en/immobilier", destination: "/fr/immobilier", permanent: true },
      { source: "/en/biens", destination: "/fr/biens", permanent: true },
      { source: "/en/vendre", destination: "/fr/vendre", permanent: true },
      { source: "/en/commercialisation", destination: "/fr/commercialisation", permanent: true },
      { source: "/en/bien/:projectId", destination: "/fr/bien/:projectId", permanent: true },
      { source: "/en/:path*", destination: "/fr/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/fr/biens", destination: "/fr/immobilier/biens" },
      { source: "/fr/vendre", destination: "/fr/immobilier/vendre" },
      { source: "/fr/commercialisation", destination: "/fr/immobilier/commercialisation" },
      { source: "/fr/bien/:projectId", destination: "/fr/immobilier/:projectId" },
    ];
  },
};

export default nextConfig;
