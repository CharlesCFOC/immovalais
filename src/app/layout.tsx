import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/siteUrl";
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Agence immobilière en Suisse romande | Immovalais", template: "%s | Immovalais" },
  description: "Découvrez des biens immobiliers sélectionnés en Valais et en Suisse romande. Immovalais vous accompagne pour acheter, vendre et valoriser votre bien.",
  applicationName: "Immovalais",
  openGraph: { type: "website", siteName: "Immovalais", locale: "fr_CH", images: [{ url: "/immobilier/hero-lac-alpes.webp", width: 2400, height: 1669, alt: "Immovalais, immobilier en Suisse romande" }] },
  twitter: { card: "summary_large_image", images: ["/immobilier/hero-lac-alpes.webp"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
