import {defaultLocale, type Locale} from '@/i18n/routing';

export const localeRoutes = {
  home: '/',
  integracoes: '/integracoes'
} as const;

const LOCAL_WEB_APP_URL = 'http://localhost:3000';
const PRODUCTION_WEB_APP_URL = 'https://web.capyra.co';
export const MCP_PUBLIC_URL = 'https://mcp.capyra.co';
export const MCP_ENDPOINT_URL = `${MCP_PUBLIC_URL}/mcp`;
export const MCP_CLIENT_ID = 'capyra-mcp';

type HeaderReader = {
  get(name: string): string | null;
};

export function localizePath(locale: Locale, path: string) {
  const normalized = path === '/' ? '' : path;
  return `/${locale}${normalized}`;
}

export function localizeHashPath(locale: Locale, path: string, hash: string) {
  return `${localizePath(locale, path)}#${hash}`;
}

export function stripLocale(pathname: string) {
  const withoutLocale = pathname.replace(/^\/(pt-br|en|es)(?=\/|$)/i, '');
  return withoutLocale.length === 0 ? '/' : withoutLocale;
}

export function switchLocalePath(pathname: string, locale: Locale) {
  const stripped = stripLocale(pathname);
  return localizePath(locale, stripped);
}

export function rootLocalePath(pathname: string) {
  return localizePath(defaultLocale, stripLocale(pathname));
}

function getHostname(host: string | null | undefined) {
  const firstHost = host?.split(',')[0]?.trim().toLowerCase();

  if (!firstHost) {
    return null;
  }

  if (firstHost.startsWith('[')) {
    return firstHost.slice(1, firstHost.indexOf(']'));
  }

  return firstHost.split(':')[0] ?? null;
}

export function getWebAppUrl(host?: string | null) {
  const hostname = getHostname(host);
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

  return isLocalHost ? LOCAL_WEB_APP_URL : PRODUCTION_WEB_APP_URL;
}

export function getWebAppUrlFromHeaders(headers: HeaderReader) {
  return getWebAppUrl(headers.get('x-forwarded-host') ?? headers.get('host'));
}

export function getLocalizedWebAppUrl(locale: Locale, host?: string | null) {
  return new URL(localizePath(locale, '/'), getWebAppUrl(host)).href;
}

export function getLocalizedWebAppUrlFromHeaders(locale: Locale, headers: HeaderReader) {
  return getLocalizedWebAppUrl(locale, headers.get('x-forwarded-host') ?? headers.get('host'));
}
