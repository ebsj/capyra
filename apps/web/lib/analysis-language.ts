import type { Locale } from "@/lib/i18n/config";

export function getAnalysisLanguage(locale: Locale): "pt-BR" | "en" | "es" {
  if (locale === "en" || locale === "es") {
    return locale;
  }

  return "pt-BR";
}
