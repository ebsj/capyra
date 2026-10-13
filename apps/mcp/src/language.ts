export const WEB_LOCALES = ["pt-br", "en", "es"] as const;
export const MCP_LANGUAGE_CODES = ["en", "es", "pt-BR"] as const;
export const DEFAULT_ANALYSIS_LANGUAGE = "pt-BR";
export const ANALYSIS_LANGUAGE_DESCRIPTION =
  "Required report and upload-page language. Use the language of the user's current message or conversation, even when the ChatGPT UI/client locale differs: use 'en' for English, 'es' for Spanish, and 'pt-BR' for Portuguese.";

type WebLocale = (typeof WEB_LOCALES)[number];
type RequestMeta = Record<string, unknown> | null | undefined;

function readMetaString(meta: RequestMeta, key: string) {
  const value = meta?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function resolveMcpLanguage(language: string | undefined | null, meta?: RequestMeta) {
  return (
    (language && language.trim()) ||
    readMetaString(meta, "openai/locale") ||
    readMetaString(meta, "webplus/i18n") ||
    DEFAULT_ANALYSIS_LANGUAGE
  );
}

export function getWebLocale(language: string | undefined | null): WebLocale {
  const normalized = language?.trim().toLowerCase();
  if (normalized === "en" || normalized === "en-us" || normalized === "en_us" || normalized === "english") {
    return "en";
  }

  if (
    normalized === "es" ||
    normalized === "es-es" ||
    normalized === "es_es" ||
    normalized === "es-mx" ||
    normalized === "es_mx" ||
    normalized === "spanish" ||
    normalized === "espanol" ||
    normalized === "español"
  ) {
    return "es";
  }

  return "pt-br";
}

export function localizeBrowserUrl(browserUrl: string, language: string | undefined | null) {
  const locale = getWebLocale(language);
  const url = new URL(browserUrl);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const appSegments = WEB_LOCALES.includes(pathSegments[0] as WebLocale) ? pathSegments.slice(1) : pathSegments;

  url.pathname = `/${locale}/${appSegments.join("/")}`;
  return url.href;
}
