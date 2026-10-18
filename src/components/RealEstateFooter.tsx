import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

export function RealEstateFooter({ locale }: { locale: Locale }) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/biens");
  const valuationHref = withLocalePath(locale, "/vendre");
  const studioHref = withLocalePath(locale, "/commercialisation");
  const adminHref = withLocalePath(locale, "/admin");

  return (
    <footer id="site-footer" className="realEstateFooter">
      <div className="realEstateFooterTop">
        <Link className="realEstateFooterLogo" href={homeHref} aria-label="Immovalais">
          Immovalais
        </Link>
        <p>Des lieux à vivre. Des projets à vendre.</p>
      </div>
      <div className="realEstateFooterGrid">
        <div>
          <p className="realEstateFooterLabel">Immobilier</p>
          <nav aria-label="Navigation immobilière">
            <Link href={homeHref}>Accueil</Link>
            <Link href={listingsHref}>Nos biens immobiliers</Link>
            <Link href={valuationHref}>{locale === "fr" ? "Vendre mon bien" : "Sell my property"}</Link>
            <Link href={studioHref}>Commercialiser mon projet</Link>
          </nav>
        </div>
        <div>
          <p className="realEstateFooterLabel">Contact</p>
          <a href="mailto:veronique.pavard@gmail.com">veronique.pavard@gmail.com</a>
          <a href="tel:+41775201044">+41 77 520 10 44</a>
        </div>
        <div>
          <p className="realEstateFooterLabel">Immovalais</p>
          <p>Suisse / Canada</p>
          <a href="https://brotherstudio.ch" target="_blank" rel="noreferrer">Site principal ↗</a>
          <Link href={adminHref}>Admin</Link>
        </div>
      </div>
      <div className="realEstateFooterBottom">
        <span>© {new Date().getFullYear()} Immovalais</span>
        <span>Créer de la valeur pour les lieux de demain.</span>
      </div>
    </footer>
  );
}
