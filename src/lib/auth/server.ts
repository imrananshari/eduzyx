import { createNeonAuth } from "@neondatabase/auth/next/server";

const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL;
const neonAuthCookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

export const isNeonAuthConfigured = Boolean(neonAuthBaseUrl && neonAuthCookieSecret && neonAuthCookieSecret.length >= 32);

export const auth = createNeonAuth({
  baseUrl: neonAuthBaseUrl ?? "https://missing-neon-auth-base-url.invalid",
  cookies: {
    secret: neonAuthCookieSecret && neonAuthCookieSecret.length >= 32 ? neonAuthCookieSecret : "development-only-cookie-secret-please-set-env"
  },
  logLevel: "warn"
});
