'use client';

import {useEffect} from 'react';

import type {Locale} from '@/i18n/routing';

const documentLanguages: Record<Locale, string> = {
  en: 'en',
  es: 'es',
  'pt-br': 'pt-BR'
};

export function DocumentLanguage({locale}: {locale: Locale}) {
  useEffect(() => {
    document.documentElement.lang = documentLanguages[locale];
  }, [locale]);

  return null;
}
