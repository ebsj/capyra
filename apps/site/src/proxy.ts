import {NextResponse, type NextRequest} from 'next/server';

const localePrefix = /^\/(pt-br|en|es)(?=\/|$)/i;
const publicFile = /\.[^/]+$/;
const knownPublicFile = /^\/(?:brand\/[a-z0-9-]+\.(?:png|webp|jpg|jpeg|svg)|icon\.png|robots\.txt|sitemap\.xml)$/i;
const iconAliasPath = /^\/(?:favicon\.ico|apple-touch-icon(?:-precomposed)?\.png)$/i;
const publicMetadataFile = /^\/(?:robots\.txt|sitemap\.xml)$/i;
const sensitiveProbePath = /(?:^|\/)(?:\.env(?:[.\-_a-z0-9]*)?|\.git(?:\/|$)|\.aws(?:\/|$)|\.docker(?:\/|$)|\.svn(?:\/|$)|\.hg(?:\/|$)|wp-admin(?:\/|$)|wp-login(?:\.php)?|xmlrpc\.php|phpunit(?:\/|$)|composer\.(?:json|lock)|id_rsa|config\/aws\.php)(?:\/|$)/i;
const dynamicResponseCacheControl = 'no-store, no-cache, max-age=0, must-revalidate, private';
const googleAnalyticsConnectOrigins = [
  'https://www.google-analytics.com',
  'https://region1.google-analytics.com'
];
const googleTagManagerScriptOrigin = 'https://www.googletagmanager.com';

function createNonce() {
  return crypto.randomUUID().replaceAll('-', '');
}

function isLocalReviewHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
}

function parseHeaderHostname(value: string | null) {
  if (!value) {
    return '';
  }

  const host = value.split(',')[0]?.trim() ?? '';
  if (host.startsWith('[')) {
    return host.slice(0, host.indexOf(']') + 1);
  }

  return host.split(':')[0] ?? '';
}

function allowsLocalReviewTools(request: NextRequest) {
  return (
    isLocalReviewHost(request.nextUrl.hostname) ||
    isLocalReviewHost(parseHeaderHostname(request.headers.get('host'))) ||
    isLocalReviewHost(parseHeaderHostname(request.headers.get('x-forwarded-host')))
  );
}

function buildContentSecurityPolicy(nonce: string, allowLocalReviewTools: boolean) {
  const scriptSrc = allowLocalReviewTools
    ? [`'self'`, googleTagManagerScriptOrigin, `'unsafe-inline'`]
    : [`'self'`, `'nonce-${nonce}'`, googleTagManagerScriptOrigin];
  const styleSrcElem = allowLocalReviewTools ? [`'self'`, `'unsafe-inline'`] : [`'self'`, `'nonce-${nonce}'`];
  const connectSrc = [`'self'`, ...googleAnalyticsConnectOrigins];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self'",
    `style-src-elem ${styleSrcElem.join(' ')}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(' ')}`,
    "media-src 'self' data: blob:"
  ].join('; ');
}

function buildRequestHeaders(request: NextRequest, nonce: string, contentSecurityPolicy: string) {
  const requestHeaders = new Headers(request.headers);
  const requestLocale = localePrefix.exec(request.nextUrl.pathname)?.[1]?.toLowerCase() ?? 'pt-br';
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-capyra-locale', requestLocale);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  return requestHeaders;
}

function applyMiddlewareHeaders(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set('Cache-Control', dynamicResponseCacheControl);
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  response.headers.set('Expires', '0');
  response.headers.set('Pragma', 'no-cache');
  return response;
}

function redirectWithHeaders(url: URL, contentSecurityPolicy: string) {
  const response = applyMiddlewareHeaders(NextResponse.redirect(url), contentSecurityPolicy);
  response.headers.set('content-type', 'text/plain; charset=utf-8');
  return response;
}

function redirectPathWithSearch(request: NextRequest, pathname: string, contentSecurityPolicy: string) {
  const url = new URL(pathname, request.url);
  url.search = request.nextUrl.search;
  return redirectWithHeaders(url, contentSecurityPolicy);
}

function notFoundWithHeaders(contentSecurityPolicy: string) {
  return applyMiddlewareHeaders(
    new NextResponse('Not Found', {
      headers: {
        'content-type': 'text/plain; charset=utf-8'
      },
      status: 404
    }),
    contentSecurityPolicy
  );
}

export function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, allowsLocalReviewTools(request));
  const requestHeaders = buildRequestHeaders(request, nonce, contentSecurityPolicy);

  if (sensitiveProbePath.test(pathname)) {
    return notFoundWithHeaders(contentSecurityPolicy);
  }

  if (iconAliasPath.test(pathname)) {
    return NextResponse.rewrite(new URL('/icon.png', request.url));
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    knownPublicFile.test(pathname)
  ) {
    if (publicMetadataFile.test(pathname)) {
      return applyMiddlewareHeaders(
        NextResponse.next({
          request: {
            headers: requestHeaders
          }
        }),
        contentSecurityPolicy
      );
    }

    return NextResponse.next();
  }

  if (publicFile.test(pathname)) {
    return notFoundWithHeaders(contentSecurityPolicy);
  }

  if (pathname === '/') {
    return redirectPathWithSearch(request, '/pt-br', contentSecurityPolicy);
  }

  if (!localePrefix.test(pathname)) {
    return redirectPathWithSearch(request, `/pt-br${pathname}`, contentSecurityPolicy);
  }

  return applyMiddlewareHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders
      }
    }),
    contentSecurityPolicy
  );
}

export const config = {
  matcher: ['/((?!_next|api).*)']
};
