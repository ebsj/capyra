import { APP_HOME_PATH } from "@/lib/features";
import type { BrandContract, AccountResponseContract, AccountUserResponseContract } from "@/lib/models";

export const AUTH_SESSION_COOKIE = "capyra_session";

export interface AuthSessionSnapshot {
  brands?: BrandContract[];
  accessToken: string | null;
  tokenType: "Bearer";
  expiresAt: string | null;
  account: AccountResponseContract;
  user: AccountUserResponseContract;
}

function safeParse<T>(value: string | undefined | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return null;
  }
}

function safeStringify(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

function readClientCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiesMap = Object.fromEntries(
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [cookieName, ...cookieValue] = entry.split("=");
        return [cookieName, cookieValue.join("=")];
      }),
  );

  return cookiesMap[name] ?? null;
}

export function readClientAuthSession() {
  return safeParse<AuthSessionSnapshot>(readClientCookie(AUTH_SESSION_COOKIE));
}

export function createAuthSessionCookieValue(session: AuthSessionSnapshot) {
  return safeStringify(session);
}

export function writeClientCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearClientCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setClientAuthSession(session: AuthSessionSnapshot) {
  writeClientCookie(AUTH_SESSION_COOKIE, createAuthSessionCookieValue(session));
}

export function clearClientAuthSession() {
  clearClientCookie(AUTH_SESSION_COOKIE);
}

export function buildSessionExpiredLoginHref(nextPath?: string | null) {
  const safeNextPath = nextPath?.startsWith("/") ? nextPath : APP_HOME_PATH;
  const params = new URLSearchParams({
    reason: "session-expired",
    next: safeNextPath,
  });

  return `/login?${params.toString()}`;
}

export function redirectClientToSessionExpiredLogin(nextPath?: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  clearClientAuthSession();
  window.location.assign(buildSessionExpiredLoginHref(nextPath ?? window.location.pathname));
}
