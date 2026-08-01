import 'dotenv/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

export const ADMIN_COOKIE_NAME = 'origin_admin_token';
const TOKEN_MESSAGE = 'origin-upvc-admin-session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getAdminPassword(): string {
  // process.env is populated from .env by the `dotenv/config` import above.
  // Reading process.env directly (rather than import.meta.env, which Astro
  // would bake in as a static value at build time) means the password can be
  // changed by editing .env and restarting the server — no rebuild required.
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is not set.');
  }
  return password;
}

/** Derives a verifiable token from the admin password, with no server-side session storage required. */
export function computeAdminToken(): string {
  return createHmac('sha256', getAdminPassword()).update(TOKEN_MESSAGE).digest('hex');
}

export function checkPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export function setAdminCookie(cookies: AstroCookies, isProd: boolean): void {
  cookies.set(ADMIN_COOKIE_NAME, computeAdminToken(), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie(cookies: AstroCookies): void {
  cookies.delete(ADMIN_COOKIE_NAME, { path: '/' });
}

/** Verifies the admin cookie (or, as a fallback, an X-Admin-Token header) on incoming API requests. */
export function isAuthorized(request: Request, cookies: AstroCookies): boolean {
  const cookieToken = cookies.get(ADMIN_COOKIE_NAME)?.value;
  const headerToken = request.headers.get('x-admin-token');
  const token = cookieToken || headerToken;
  if (!token) return false;

  const expected = computeAdminToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
