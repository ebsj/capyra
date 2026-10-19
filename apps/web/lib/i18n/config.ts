export const locales = ["pt-br", "en", "es"] as const;
export const defaultLocale = "pt-br" satisfies Locale;
export const localeHeaderName = "x-capyra-locale";
export const pathHeaderName = "x-capyra-pathname";

export type Locale = (typeof locales)[number];

const localeSet = new Set<string>(locales);

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === "string" && localeSet.has(value.toLowerCase());
}

export function normalizeLocale(value: string | undefined | null): Locale {
  const normalized = value?.toLowerCase();
  return isLocale(normalized) ? normalized : defaultLocale;
}

export function getLocalePrefix(pathname: string) {
  const segment = pathname.split("/")[1];
  return normalizeLocale(segment);
}

export function stripLocalePrefix(pathname: string) {
  const segments = pathname.split("/");
  const firstSegment = segments[1]?.toLowerCase();

  if (!isLocale(firstSegment)) {
    return pathname || "/";
  }

  const stripped = `/${segments.slice(2).join("/")}`;
  return stripped === "/" ? "/" : stripped.replace(/\/$/, "") || "/";
}

export function pathnameHasLocale(pathname: string) {
  return isLocale(pathname.split("/")[1]);
}

export function localizePath(pathname: string, locale: Locale) {
  if (/^(?:https?:)?\/\//.test(pathname) || pathname.startsWith("#")) {
    return pathname;
  }

  const [path = "/", hash = ""] = pathname.split("#");
  const [barePath = "/", query = ""] = path.split("?");
  const stripped = stripLocalePrefix(barePath.startsWith("/") ? barePath : `/${barePath}`);
  const localized = stripped === "/" ? `/${locale}` : `/${locale}${stripped}`;
  const withQuery = query ? `${localized}?${query}` : localized;
  return hash ? `${withQuery}#${hash}` : withQuery;
}
