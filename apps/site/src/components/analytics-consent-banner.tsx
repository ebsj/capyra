'use client';

import {useEffect, useState} from 'react';

import {
  hasGoogleAnalyticsConfig,
  persistGoogleAnalyticsConsent,
  readStoredGoogleAnalyticsConsent
} from '@/lib/google-analytics-client';

const copy = {
  'pt-br': {
    accept: 'Aceitar analytics',
    decline: 'Manter desativado',
    description:
      'Usamos Google Analytics para entender jornada e melhorar o produto. Sem aceite, a tag permanece sem armazenamento de analytics.',
    title: 'Analytics'
  },
  en: {
    accept: 'Allow analytics',
    decline: 'Keep disabled',
    description:
      'We use Google Analytics to understand journeys and improve the product. Without consent, the tag keeps analytics storage disabled.',
    title: 'Analytics'
  },
  es: {
    accept: 'Aceptar analytics',
    decline: 'Mantener desactivado',
    description:
      'Usamos Google Analytics para entender recorridos y mejorar el producto. Sin consentimiento, la etiqueta mantiene desactivado el almacenamiento de analytics.',
    title: 'Analytics'
  }
} as const;

function getLocale() {
  const segment = window.location.pathname.split('/')[1]?.toLowerCase();
  return segment === 'en' || segment === 'es' || segment === 'pt-br' ? segment : 'pt-br';
}

export function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);
  const locale: keyof typeof copy = typeof window === 'undefined' ? 'pt-br' : getLocale();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(hasGoogleAnalyticsConfig() && readStoredGoogleAnalyticsConsent() === null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) {
    return null;
  }

  const text = copy[locale];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-2xl shadow-black/10 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-foreground">{text.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{text.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-foreground transition hover:bg-muted"
            type="button"
            onClick={() => {
              persistGoogleAnalyticsConsent('denied');
              setVisible(false);
            }}
          >
            {text.decline}
          </button>
          <button
            className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-brand-foreground transition hover:bg-brand/90"
            type="button"
            onClick={() => {
              persistGoogleAnalyticsConsent('granted');
              setVisible(false);
            }}
          >
            {text.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
