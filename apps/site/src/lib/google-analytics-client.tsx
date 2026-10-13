'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

import {
  GOOGLE_ANALYTICS_PUBLIC_CONFIG_SCRIPT_ID,
  type GoogleAnalyticsPublicConfig
} from '@/lib/google-analytics-public-config';

type GoogleAnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;
type StoredGoogleAnalyticsConsent = 'granted' | 'denied';

const consentStorageKey = 'capyra_ga4_consent';
const marketingParamPattern = /^(?:_gl|utm_[a-z0-9_]+|gclid|gbraid|wbraid)$/i;

let cachedConfig: GoogleAnalyticsPublicConfig | null | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeParams(params: GoogleAnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
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
      typeof parsed.measurementId === 'string' && parsed.measurementId.trim()
        ? {
            environment:
              typeof parsed.environment === 'string' && parsed.environment.trim()
                ? parsed.environment.trim()
                : 'development',
            measurementId: parsed.measurementId.trim(),
            surface: 'site'
          }
        : null;
  } catch {
    cachedConfig = null;
  }

  return cachedConfig;
}

function getPathLocale() {
  const segment = window.location.pathname.split('/')[1]?.toLowerCase();
  return segment === 'en' || segment === 'es' || segment === 'pt-br' ? segment : 'pt-br';
}

export function hasGoogleAnalyticsConfig() {
  return Boolean(readGoogleAnalyticsConfig()?.measurementId && window.gtag);
}

export function readStoredGoogleAnalyticsConsent(): StoredGoogleAnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(consentStorageKey);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function updateGoogleAnalyticsConsent(granted: boolean) {
  if (!hasGoogleAnalyticsConfig()) {
    return;
  }

  window.gtag?.('consent', 'update', {
    ad_personalization: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    analytics_storage: granted ? 'granted' : 'denied'
  });
}

export function persistGoogleAnalyticsConsent(consent: StoredGoogleAnalyticsConsent) {
  try {
    window.localStorage.setItem(consentStorageKey, consent);
  } catch {}

  updateGoogleAnalyticsConsent(consent === 'granted');
}

export function trackGoogleAnalyticsEvent(
  name: string,
  params: GoogleAnalyticsEventParams = {}
) {
  const config = readGoogleAnalyticsConfig();
  if (!config?.measurementId || !window.gtag) {
    return;
  }

  window.gtag(
    'event',
    name,
    sanitizeParams({
      environment: config.environment,
      surface: config.surface,
      ...params
    })
  );
}

export function appendCurrentMarketingParams(href: string) {
  if (typeof window === 'undefined') {
    return href;
  }

  try {
    const target = new URL(href, window.location.href);
    const current = new URL(window.location.href);

    for (const [key, value] of current.searchParams.entries()) {
      if (marketingParamPattern.test(key) && !target.searchParams.has(key)) {
        target.searchParams.append(key, value);
      }
    }

    return target.href;
  } catch {
    return href;
  }
}

export function GoogleAnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const storedConsent = readStoredGoogleAnalyticsConsent();
    if (storedConsent) {
      updateGoogleAnalyticsConsent(storedConsent === 'granted');
    }

    trackGoogleAnalyticsEvent('page_view', {
      locale: getPathLocale(),
      page_location: window.location.href,
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title
    });
  }, [pathname]);

  return null;
}
