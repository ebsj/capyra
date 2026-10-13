import { NextResponse, type NextRequest } from "next/server";

import {
  defaultLocale,
  localeHeaderName,
  localizePath,
  normalizeLocale,
  pathHeaderName,
  pathnameHasLocale,
  stripLocalePrefix,
  type Locale,
} from "@/lib/i18n/config";
import { AUTH_SESSION_COOKIE, type AuthSessionSnapshot } from "@/lib/session";

const protectedPathPrefixes = ["/dashboard", "/analyses", "/integrations", "/brands", "/library", "/team", "/usage", "/notifications", "/social-publications", "/social-metrics", "/invitations", "/profile"];
const publicFile = /\.[^/]+$/;
const knownPublicFile = /^\/(?:brand\/[a-z0-9-]+\.png|icon\.png)$/i;
const iconAliasPath = /^\/(?:favicon\.ico|apple-touch-icon(?:-precomposed)?\.png)$/i;
const sensitiveProbePath = /(?:^|\/)(?:\.env(?:[.\-_a-z0-9]*)?|\.git(?:\/|$)|\.aws(?:\/|$)|\.docker(?:\/|$)|\.svn(?:\/|$)|\.hg(?:\/|$)|wp-admin(?:\/|$)|wp-login(?:\.php)?|xmlrpc\.php|phpunit(?:\/|$)|composer\.(?:json|lock)|id_rsa|config\/aws\.php)(?:\/|$)/i;
const dynamicResponseCacheControl = "no-store, no-cache, max-age=0, must-revalidate, private";
const googleAnalyticsConnectOrigins = [
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
];
const googleTagManagerScriptOrigin = "https://www.googletagmanager.com";
const sourceAssetUploadOrigin = "https://*.r2.cloudflarestorage.com";

function createNonce() {
  return crypto.randomUUID().replaceAll("-", "");
}

function isLocalReviewHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function parseHeaderHostname(value: string | null) {
  if (!value) {
    return "";
  }

  const host = value.split(",")[0]?.trim() ?? "";
  if (host.startsWith("[")) {
    return host.slice(0, host.indexOf("]") + 1);
  }

  return host.split(":")[0] ?? "";
}

function allowsLocalReviewTools(request: NextRequest) {
  return (
    isLocalReviewHost(request.nextUrl.hostname) ||
    isLocalReviewHost(parseHeaderHostname(request.headers.get("host"))) ||
    isLocalReviewHost(parseHeaderHostname(request.headers.get("x-forwarded-host")))
  );
}

function readLocalSourceAssetUploadOrigin(value: string = "http://localhost:5080") {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    return isHttp && isLocalReviewHost(url.hostname) ? url.origin : "";
  } catch {
    return "";
  }
}

function buildContentSecurityPolicy(nonce: string, allowLocalReviewTools: boolean) {
  const scriptSrc = allowLocalReviewTools
    ? [`'self'`, "https://apis.google.com", googleTagManagerScriptOrigin, `'unsafe-inline'`]
    : [`'self'`, `'nonce-${nonce}'`, "https://apis.google.com", googleTagManagerScriptOrigin];
  const styleSrc = [`'self'`, `'nonce-${nonce}'`];
  // Browsers ignore 'unsafe-inline' when a nonce is present, so local review tools need a nonce-free branch.
  const styleSrcElem = allowLocalReviewTools ? [`'self'`, `'unsafe-inline'`] : [`'self'`, `'nonce-${nonce}'`];
  const localSourceAssetUploadOrigin = allowLocalReviewTools
    ? readLocalSourceAssetUploadOrigin(process.env.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN)
    : "";
  const connectSrc = [
    "'self'",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://apis.google.com",
    ...googleAnalyticsConnectOrigins,
    sourceAssetUploadOrigin,
    localSourceAssetUploadOrigin,
  ].filter(Boolean);

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `style-src-elem ${styleSrcElem.join(" ")}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
    "media-src 'self' data: blob:",
  ].join("; ");
}

function readSession(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as AuthSessionSnapshot;
  } catch {
    return null;
  }
}

function isExpired(session: AuthSessionSnapshot | null) {
  if (!session?.expiresAt) {
    return false;
  }

  const expiresAt = new Date(session.expiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() <= Date.now();
}

function buildLoginUrl(request: NextRequest, locale: Locale, nextPath: string, reason: "auth-required" | "session-expired") {
  const loginUrl = new URL(localizePath("/login", locale), request.url);
  loginUrl.searchParams.set("next", nextPath);
  loginUrl.searchParams.set("reason", reason);
  return loginUrl;
}

function buildRequestHeaders(request: NextRequest, nonce: string, contentSecurityPolicy: string, locale: string, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(localeHeaderName, locale);
  requestHeaders.set(pathHeaderName, pathname);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  return requestHeaders;
}

function applyMiddlewareHeaders(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set("Cache-Control", dynamicResponseCacheControl);
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function redirectWithHeaders(url: URL, contentSecurityPolicy: string) {
  const response = applyMiddlewareHeaders(NextResponse.redirect(url), contentSecurityPolicy);
  response.headers.set("content-type", "text/plain; charset=utf-8");
  return response;
}

function notFoundWithHeaders(contentSecurityPolicy: string) {
  return applyMiddlewareHeaders(
    new NextResponse("Not Found", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
      status: 404,
    }),
    contentSecurityPolicy,
  );
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasLocale = pathnameHasLocale(pathname);
  const locale = hasLocale ? normalizeLocale(pathname.split("/")[1]) : defaultLocale;
  const appPathname = hasLocale ? stripLocalePrefix(pathname) : pathname;
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, allowsLocalReviewTools(request));
  const requestHeaders = buildRequestHeaders(request, nonce, contentSecurityPolicy, locale, appPathname);
  const session = readSession(request.cookies.get(AUTH_SESSION_COOKIE)?.value);
  const hasActiveSession = session !== null && !isExpired(session);

  if (sensitiveProbePath.test(appPathname)) {
    return notFoundWithHeaders(contentSecurityPolicy);
  }

  if (iconAliasPath.test(appPathname)) {
    return NextResponse.rewrite(new URL("/icon.png", request.url));
  }

  if (knownPublicFile.test(appPathname)) {
    return NextResponse.next();
  }

  if (publicFile.test(appPathname)) {
    return notFoundWithHeaders(contentSecurityPolicy);
  }

  if (!hasLocale) {
    const targetPath = appPathname === "/" ? (hasActiveSession ? "/dashboard" : "/login") : appPathname;
    const targetUrl = new URL(localizePath(targetPath, defaultLocale), request.url);
    targetUrl.search = request.nextUrl.search;
    return redirectWithHeaders(targetUrl, contentSecurityPolicy);
  }

  if (!hasActiveSession && protectedPathPrefixes.some((prefix) => appPathname === prefix || appPathname.startsWith(`${prefix}/`))) {
    const reason = session && isExpired(session) ? "session-expired" : "auth-required";
    return redirectWithHeaders(buildLoginUrl(request, locale, `${pathname}${request.nextUrl.search}`, reason), contentSecurityPolicy);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = appPathname;

  return applyMiddlewareHeaders(
    NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    }),
    contentSecurityPolicy,
  );
}

export const config = {
  matcher: ["/((?!api|_next).*)"],
};
