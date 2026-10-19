import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {getTranslations} from 'next-intl/server';

import type {Locale} from '@/i18n/routing';
import {localizeHashPath, localizePath, localeRoutes} from '@/lib/routes';
import {LanguageSwitcher} from '@/components/client-language-switcher';
import {LeadCaptureButton} from '@/components/lead-capture';

const footerNav = [
  {key: 'overview', hash: 'overview'},
  {key: 'integrations', hash: 'integrations'},
  {key: 'workflow', hash: 'workflow'},
  {key: 'results', hash: 'results'},
  {key: 'audience', hash: 'audience'}
] as const;

type Props = {
  locale: Locale;
  pathname: string;
};

export async function SiteFooter({locale, pathname}: Props) {
  const nav = await getTranslations({locale, namespace: 'nav'});
  const actions = await getTranslations({locale, namespace: 'actions'});
  const common = await getTranslations({locale, namespace: 'common'});
  const footer = await getTranslations({locale, namespace: 'footer'});

  return (
    <footer className="border-t border-[rgb(var(--hero-border))] bg-[rgb(var(--hero-bg))] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start">
          <div className="max-w-xl">
            <Link className="group inline-flex items-center gap-3" href={localizePath(locale, localeRoutes.home)}>
              <span className="relative flex h-12 w-12">
                <Image alt={common('visual.logoAlt')} className="object-contain" fill sizes="48px" src="/brand/logo.png" />
              </span>
              <span>
                <span className="block font-display text-2xl font-extrabold text-white">
                  {common('name')}
                </span>
                <span className="block text-sm text-white/60">{common('tagline')}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/60">
              {footer('description')}
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <p className="text-xs font-semibold uppercase text-white/45">
              {footer('links')}
            </p>
            {footerNav.map((item) => (
              <Link
                key={item.key}
                className="font-medium text-white/70 transition hover:text-white"
                href={localizeHashPath(locale, localeRoutes.home, item.hash)}
              >
                {nav(item.key)}
              </Link>
            ))}
            <Link
              className="font-medium text-white/70 transition hover:text-white"
              href={localizePath(locale, localeRoutes.integracoes)}
            >
              {footer('integrations')}
            </Link>
          </div>

          <div className="space-y-3">
            <LanguageSwitcher
              enLabel={actions('switchToEnglish')}
              esLabel={actions('switchToSpanish')}
              locale={locale}
              pathname={pathname}
              ptLabel={actions('switchToPortuguese')}
              tone="dark"
            />
            <LeadCaptureButton className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-glow transition hover:-translate-y-0.5 hover:bg-brand/90" locale={locale}>
              {actions('createAccount')}
              <ArrowRight className="h-4 w-4" />
            </LeadCaptureButton>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{footer('legal')}</p>
          <p>{footer('localeHint')}</p>
        </div>
      </div>
    </footer>
  );
}
