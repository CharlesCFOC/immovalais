import type { ReactNode } from "react";
import { LOCALES } from "@/lib/i18n";
import { resolveLocaleParam } from "@/lib/localeParams";
export const dynamicParams = false;
export function generateStaticParams() { return LOCALES.map((locale) => ({ locale })); }
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleParam(params);
  return <div lang={locale}>{children}</div>;
}
