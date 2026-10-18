import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const ADMIN_SESSION_COOKIE = "maman_admin_session";
function secret() {
  return "immovalais-admin-session-cookie-key";
}
export function createAdminSession() {
  const expires = String(Date.now() + 86_400_000);
  return `${expires}.${createHmac("sha256", secret()).update(expires).digest("hex")}`;
}
export async function hasAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(expires).digest("hex");
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
