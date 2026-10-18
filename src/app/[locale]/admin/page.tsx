import type { Metadata } from "next";
import { RealEstateAdminPortal } from "@/components/RealEstateAdminPortal";
import { RealEstateFooter } from "@/components/RealEstateFooter";
import { RealEstateNavigation } from "@/components/RealEstateNavigation";
import { resolveLocaleParam } from "@/lib/localeParams";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await resolveLocaleParam(params)) as Locale;
  return (
    <>
      <RealEstateNavigation locale={locale} />
      <RealEstateAdminPortal locale={locale} />
      <RealEstateFooter locale={locale} />
    </>
  );
}
