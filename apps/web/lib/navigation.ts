import { defaultLocale, normalizeLocale, stripLocalePrefix, type Locale } from "@/lib/i18n/config";
import { APP_HOME_PATH } from "@/lib/features";

export function normalizeNextHref(nextHref?: string | null, fallbackHref = APP_HOME_PATH) {
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
