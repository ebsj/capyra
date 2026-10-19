"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  locales,
  localizePath,
  normalizeLocale,
  stripLocalePrefix,
  type Locale,
} from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useI18n } from "./i18n-provider";

const localeLabels: Record<Locale, string> = {
  "pt-br": "PT",
  en: "EN",
  es: "ES",
};

const localeNames: Record<Locale, string> = {
  "pt-br": "Português",
  en: "English",
  es: "Español",
};

function getLocaleName(locale: Locale) {
  return localeNames[locale];
}

function buildLocaleHref(pathname: string, search: string, locale: Locale) {
  const appPathname = stripLocalePrefix(pathname);
  const pathWithSearch = search ? `${appPathname}?${search}` : appPathname;
  return localizePath(pathWithSearch, locale);
}

export function LocaleToggle({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [refreshLocale, setRefreshLocale] = useState<Locale | null>(null);
  const search = searchParams.toString();
  const activeLocale = normalizeLocale(pathname.split("/")[1]);

  useEffect(() => {
    if (refreshLocale && refreshLocale === activeLocale) {
      router.refresh();
      setRefreshLocale(null);
    }
  }, [activeLocale, refreshLocale, router]);

  return (
    <nav
      aria-label={t("Idioma")}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-2xl border border-border bg-card p-1 shadow-sm",
        className,
      )}
    >
      {locales.map((item) => {
        const active = item === activeLocale;
        const targetHref = buildLocaleHref(pathname, search, item);

        return (
          <button
            key={item}
            type="button"
            aria-current={active ? "true" : undefined}
            aria-label={t("Mudar idioma para {language}", { language: getLocaleName(item) })}
            disabled={active || isPending}
            onClick={() => {
              if (!active) {
                setRefreshLocale(item);
                startTransition(() => {
                  router.push(targetHref);
                });
              }
            }}
            className={cn(
              "flex h-8 min-w-10 items-center justify-center rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              active
                ? "cursor-default bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            {localeLabels[item]}
          </button>
        );
      })}
    </nav>
  );
}
