import "server-only";

import { APP_HOME_PATH } from "@/lib/features";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/http";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { AUTH_SESSION_COOKIE, type AuthSessionSnapshot } from "@/lib/session";

type AuthRedirectReason = "auth-required" | "session-expired";

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

export async function readAuthSessionFromCookieStore() {
  const cookieStore = await cookies();
  return safeParse<AuthSessionSnapshot>(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
}

export function isAuthSessionExpired(session: AuthSessionSnapshot | null | undefined) {
  if (!session?.expiresAt) {
    return false;
  }

  const expiresAt = new Date(session.expiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  return expiresAt.getTime() <= Date.now();
}

export function getAuthRedirectReason(session: AuthSessionSnapshot | null | undefined): AuthRedirectReason {
  return isAuthSessionExpired(session) ? "session-expired" : "auth-required";
}

export function buildLoginRedirect(nextPath: string, reason: AuthRedirectReason = "auth-required", locale?: Locale) {
  const safeNextPath = nextPath.startsWith("/") ? nextPath : APP_HOME_PATH;
  const params = new URLSearchParams({
    next: locale ? localizePath(safeNextPath, locale) : safeNextPath,
    reason,
  });

  const loginPath = locale ? localizePath("/login", locale) : "/login";
  return `${loginPath}?${params.toString()}`;
}

export async function readActiveAuthSessionFromCookieStore() {
  const session = await readAuthSessionFromCookieStore();
  return isAuthSessionExpired(session) ? null : session;
}

export function redirectToLoginOnAuthApiError(error: unknown, nextPath: string, locale?: Locale): never | void {
  if (error instanceof ApiError && (error.status === 401 || (error.status === 403 && error.code === "account_access_revoked"))) {
    redirect(buildLoginRedirect(nextPath, "session-expired", locale));
  }
}
