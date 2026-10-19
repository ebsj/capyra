import Link from 'next/link';
import {getLocale, getTranslations} from 'next-intl/server';

import {LeadCaptureButton} from '@/components/lead-capture';
import {SiteFrame} from '@/components/site-frame';
import type {Locale} from '@/i18n/routing';
import {localizePath, localeRoutes} from '@/lib/routes';

export default async function NotFoundPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({locale, namespace: 'notFound'});
  const actions = await getTranslations({locale, namespace: 'actions'});

  return (
    <SiteFrame locale={locale} pathname={localizePath(locale, localeRoutes.home)}>
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
        <div className="max-w-2xl rounded-[2.25rem] border border-border bg-card p-8 text-center shadow-panel md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">404</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-navy md:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            {t('description')}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground shadow-glow transition hover:-translate-y-0.5 hover:bg-brand/90"
              href={localizePath(locale, localeRoutes.home)}
            >
              {t('backHome')}
            </Link>
            <LeadCaptureButton className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-soft" locale={locale}>
              {actions('createAccount')}
            </LeadCaptureButton>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
