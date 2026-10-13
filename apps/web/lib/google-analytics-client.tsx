"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  GOOGLE_ANALYTICS_PUBLIC_CONFIG_SCRIPT_ID,
  type GoogleAnalyticsPublicConfig,
} from "@/lib/google-analytics-public-config";
import type { Locale } from "@/lib/i18n/config";

type GoogleAnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;
type StoredGoogleAnalyticsConsent = "granted" | "denied";

const consentStorageKey = "capyra_ga4_consent";

let cachedConfig: GoogleAnalyticsPublicConfig | null | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeParams(params: GoogleAnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
}

function readGoogleAnalyticsConfig() {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const script = document.getElementById(GOOGLE_ANALYTICS_PUBLIC_CONFIG_SCRIPT_ID);
  if (!script?.textContent) {
    cachedConfig = null;
    return cachedConfig;
  }

  try {
    const parsed = JSON.parse(script.textContent) as Partial<GoogleAnalyticsPublicConfig>;
    cachedConfig =
      typeof parsed.measurementId === "string" && parsed.measurementId.trim()
        ? {
            environment:
              typeof parsed.environment === "string" && parsed.environment.trim()
                ? parsed.environment.trim()
                : "development",
            measurementId: parsed.measurementId.trim(),
            surface: "web",
          }
        : null;
  } catch {
    cachedConfig = null;
  }

  return cachedConfig;
}

export function hasGoogleAnalyticsConfig() {
  return Boolean(readGoogleAnalyticsConfig()?.measurementId && window.gtag);
}

export function readStoredGoogleAnalyticsConsent(): StoredGoogleAnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(consentStorageKey);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function updateGoogleAnalyticsConsent(granted: boolean) {
  if (!hasGoogleAnalyticsConfig()) {
    return;
  }

  window.gtag?.("consent", "update", {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
}

export function persistGoogleAnalyticsConsent(consent: StoredGoogleAnalyticsConsent) {
  try {
    window.localStorage.setItem(consentStorageKey, consent);
  } catch {}

  updateGoogleAnalyticsConsent(consent === "granted");
}

export function setGoogleAnalyticsUserId(userId: string | null | undefined) {
  if (!hasGoogleAnalyticsConfig()) {
    return;
  }

  window.gtag?.("set", sanitizeParams({ user_id: userId?.trim() || null }));
}

export function trackGoogleAnalyticsEvent(
  name: string,
  params: GoogleAnalyticsEventParams = {},
) {
  const config = readGoogleAnalyticsConfig();
  if (!config?.measurementId || !window.gtag) {
    return;
  }

  window.gtag(
    "event",
    name,
    sanitizeParams({
      environment: config.environment,
      surface: config.surface,
      ...params,
    }),
  );
}

export function GoogleAnalyticsProvider({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  useEffect(() => {
    const storedConsent = readStoredGoogleAnalyticsConsent();
    if (storedConsent) {
      updateGoogleAnalyticsConsent(storedConsent === "granted");
    }

    trackGoogleAnalyticsEvent("page_view", {
      locale,
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title,
    });
  }, [locale, pathname]);

  return null;
}
