export const AUTH_COOKIE = "fapp_auth";
const COOKIE_VALUE = "ok";

export function verifyPassword(input: string | undefined) {
  const expected = process.env.FAPP_PASSWORD ?? "";
  return !!input && expected.length > 0 && input === expected;
}

export function buildAuthCookie(): string {
  // HttpOnly, Secure in prod, SameSite Lax
  const base = `${AUTH_COOKIE}=${COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax;`;
  return process.env.NODE_ENV === "production" ? base + " Secure;" : base;
}

export function clearAuthCookie(): string {
  return `${AUTH_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax;`;
}
