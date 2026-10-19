import type { Locale } from "@/lib/i18n/config";

const dateLocales: Record<Locale, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
};

export function toDateLocale(locale: Locale) {
  return dateLocales[locale];
}
