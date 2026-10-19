import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Sans, Kanit } from "next/font/google";
import type { ReactNode } from "react";
import { AnalyticsConsentBanner } from "@/components/analytics-consent-banner";
import { FirebasePublicConfigScript } from "@/components/firebase-public-config-script";
import { GoogleAnalyticsConfigScript } from "@/components/google-analytics-config-script";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { GoogleAnalyticsProvider } from "@/lib/google-analytics-client";
import { localeHeaderName, normalizeLocale, type Locale } from "@/lib/i18n/config";
import "./globals.css";

// Tailwind maps `font-display` to Kanit and `font-sans` to IBM Plex Sans.
const display = Kanit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Capyra Workspace",
    template: "%s | Capyra",
  },
  description:
    "Capyra authenticated evidence-ledger workspace with contextual creation, triage, investigation, and recovery surfaces.",
};

const htmlLangByLocale: Record<Locale, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const locale = normalizeLocale(requestHeaders.get(localeHeaderName));
  const htmlLang = htmlLangByLocale[locale];

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary-foreground`}
        data-surface="root"
      >
        <GoogleAnalyticsConfigScript nonce={nonce} />
        <FirebasePublicConfigScript nonce={nonce} />
        <GoogleAnalyticsProvider locale={locale} />
        <I18nProvider locale={locale}>
          {children}
          <AnalyticsConsentBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
