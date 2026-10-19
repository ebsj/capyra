import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {IBM_Plex_Sans, Kanit} from 'next/font/google';
import type {ReactNode} from 'react';

import {AnalyticsConsentBanner} from '@/components/analytics-consent-banner';
import {GoogleAnalyticsConfigScript} from '@/components/google-analytics-config-script';
import {GoogleAnalyticsProvider} from '@/lib/google-analytics-client';
import './globals.css';

const display = Kanit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800']
});

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700']
});

const siteUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://capyra.co';

export const metadata: Metadata = {
  title: {
    default: 'Capyra',
    template: '%s | Capyra'
  },
  description:
    'Capyra turns public URLs and short-video files into structured readings with skills, evidence, recommendations, and shareable snapshots.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    images: [
      {
        alt: 'Capyra',
        height: 500,
        url: '/brand/logo.png',
        width: 500
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/brand/logo.png']
  }
};

const documentLanguages: Record<string, string> = {
  en: 'en',
  es: 'es',
  'pt-br': 'pt-BR'
};

export default async function RootLayout({children}: Readonly<{children: ReactNode}>) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get('x-nonce') ?? undefined;
  const documentLanguage = documentLanguages[requestHeaders.get('x-capyra-locale') ?? ''] ?? 'pt-BR';

  return (
    <html lang={documentLanguage} suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} bg-background font-sans text-foreground antialiased`}
      >
        <GoogleAnalyticsConfigScript nonce={nonce} />
        <GoogleAnalyticsProvider />
        {children}
        <AnalyticsConsentBanner />
      </body>
    </html>
  );
}
