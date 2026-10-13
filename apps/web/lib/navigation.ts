import { defaultLocale, normalizeLocale, stripLocalePrefix, type Locale } from "@/lib/i18n/config";

export function normalizeNextHref(nextHref?: string | null, fallbackHref = "/dashboard") {
  if (!nextHref || !nextHref.startsWith("/") || nextHref.startsWith("//") || nextHref.includes("\\")) {
    return fallbackHref;
  }

  return nextHref;
}

export function getLocaleFromPathname(pathname: string): Locale {
  return normalizeLocale(pathname.split("/")[1] ?? defaultLocale);
}

export function getAppPathname(pathname: string) {
  return stripLocalePrefix(pathname);
}
