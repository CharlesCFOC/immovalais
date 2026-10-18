export const LOCALES = ["fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
export function withLocalePath(locale: Locale, pathname: string): string {
  const base = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  return `/${locale}${base}`;
}
export function getLanguageAlternates(pathname: string) {
  const frenchPath = withLocalePath("fr", pathname);
  return { fr: frenchPath, "x-default": frenchPath };
}
