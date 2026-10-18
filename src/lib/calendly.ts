export const CALENDLY_MEETING_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/brotherstudio-info/30min";
export function buildCalendlyEmbedUrl(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}hide_gdpr_banner=1`;
}
