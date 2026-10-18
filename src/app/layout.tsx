import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/siteUrl";
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Immovalais | Suisse romande", template: "%s | Immovalais" },
  description: "Biens immobiliers sélectionnés en Suisse romande et accompagnement de la vente, de l’estimation à la signature.",
  applicationName: "Immovalais",
  openGraph: { type: "website", siteName: "Immovalais", locale: "fr_CH" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
