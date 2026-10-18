import Link from "next/link";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

export function RealEstateFooter({ locale }: { locale: Locale }) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/immobilier/biens");
  const valuationHref = withLocalePath(locale, "/immobilier/vendre");
  const studioHref = withLocalePath(locale, "/immobilier/commercialisation");
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
            <Link href={homeHref}>Home</Link>
            <Link href={listingsHref}>Nos biens immobiliers</Link>
            <Link href={valuationHref}>{locale === "fr" ? "Vendre mon bien" : "Sell my property"}</Link>
            <Link href={studioHref}>Commercialiser mon projet</Link>
          </nav>
        </div>
        <div>
          <p className="realEstateFooterLabel">Contact</p>
          <a href="mailto:info@brotherstudio.ca">{locale === "fr" ? "Nous écrire" : "Email us"}</a>
          <a href="tel:+14376773212">+1 437 677 3212</a>
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
