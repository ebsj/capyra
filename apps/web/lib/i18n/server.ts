import "server-only";

import { headers } from "next/headers";

import { localeHeaderName, normalizeLocale, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  return normalizeLocale(requestHeaders.get(localeHeaderName));
}

export async function getServerTranslator() {
  const locale = await getRequestLocale();
  return {
    locale,
    t: (source: string, values?: Record<string, string | number>) => translate(locale, source, values),
  };
}
