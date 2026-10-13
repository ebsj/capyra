import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {ReactNode} from 'react';

import {DocumentLanguage} from '@/components/document-language';
import {isLocale, locales, type Locale} from '@/i18n/routing';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  return (
    <>
      <DocumentLanguage locale={locale as Locale} />
      {children}
    </>
  );
}
