"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { localizePath, normalizeLocale, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  t: (source: string, values?: Record<string, string | number>) => string;
  href: (pathname: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const pathname = usePathname();
  const effectiveLocale = normalizeLocale(pathname.split("/")[1] ?? locale);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: effectiveLocale,
      t: (source, values) => translate(effectiveLocale, source, values),
      href: (pathname) => localizePath(pathname, effectiveLocale),
    }),
    [effectiveLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
