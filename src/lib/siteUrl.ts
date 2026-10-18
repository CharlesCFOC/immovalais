function normalizedUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}
export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://immovalais.vercel.app";
  return new URL(normalizedUrl(value));
}
export function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, getSiteUrl()).toString();
}
