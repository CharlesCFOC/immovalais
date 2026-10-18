import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/siteUrl";
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Brother Studio Immobilier | Suisse romande", template: "%s | Brother Studio Immobilier" },
  description: "Biens immobiliers sélectionnés en Suisse romande et accompagnement de la vente, de l’estimation à la signature.",
  applicationName: "Brother Studio Immobilier",
  openGraph: { type: "website", siteName: "Brother Studio Immobilier", locale: "fr_CH" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
