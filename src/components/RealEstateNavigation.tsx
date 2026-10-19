import Link from "next/link";
import theme from "./RealEstateTheme.module.css";

import type { Locale } from "@/lib/i18n";
import { withLocalePath } from "@/lib/i18n";

type RealEstateNavigationProps = {
  locale: Locale;
  active?: "home" | "listings" | "studio" | "sell";
};

export function RealEstateNavigation({ locale, active = "home" }: RealEstateNavigationProps) {
  const homeHref = withLocalePath(locale, "/immobilier");
  const listingsHref = withLocalePath(locale, "/biens");
  const valuationHref = withLocalePath(locale, "/vendre");

  return (
    <header className="realEstateLocalHeader">
      <span className={theme.theme} hidden aria-hidden="true" />
      <div className="realEstateLocalHeaderInner">
        <Link className="realEstateLocalLogo" href={homeHref} aria-label="Immobilier valaisan">
          Immobilier valaisan
        </Link>
        <nav className="realEstateLocalNav" aria-label="Navigation immobilier">
          <Link className={active === "home" ? "is-active" : ""} href={homeHref}>Accueil</Link>
          <Link className={active === "listings" ? "is-active" : ""} href={listingsHref}>Nos biens immobiliers</Link>
          <Link className={active === "sell" ? "is-active" : ""} href={valuationHref}>{locale === "fr" ? "Vendre mon bien" : "Sell my property"}</Link>
          <a href="#site-footer">Contact</a>
        </nav>
      </div>
    </header>
  );
}
