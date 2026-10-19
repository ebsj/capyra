import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight, Menu} from 'lucide-react';
import {getTranslations} from 'next-intl/server';

import {LanguageSwitcher} from '@/components/client-language-switcher';
import {LeadCaptureButton} from '@/components/lead-capture';
import {localizeHashPath, localizePath, localeRoutes} from '@/lib/routes';
import type {Locale} from '@/i18n/routing';
import {cn} from '@/lib/utils';

const navItems = [
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

export async function SiteHeader({locale, pathname}: Props) {
  const nav = await getTranslations({locale, namespace: 'nav'});
  const actions = await getTranslations({locale, namespace: 'actions'});
  const common = await getTranslations({locale, namespace: 'common'});

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="group flex shrink-0 items-center gap-3" href={localizePath(locale, localeRoutes.home)}>
          <span className="relative flex h-11 w-11 shrink-0 sm:h-12 sm:w-12">
            <Image
              alt="Capyra"
              className="object-contain"
              fill
              priority
              sizes="48px"
              src="/brand/logo.png"
            />
          </span>
          <span className="hidden min-w-0 sm:flex">
            <span className="font-display text-xl font-extrabold leading-none text-navy">
              {common('name')}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-brand-soft hover:text-navy'
              )}
              href={localizeHashPath(locale, localeRoutes.home, item.hash)}
            >
              {nav(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher
            enLabel={actions('switchToEnglish')}
            esLabel={actions('switchToSpanish')}
            locale={locale}
            pathname={pathname}
            ptLabel={actions('switchToPortuguese')}
          />
          <div className="hidden items-center gap-2 xl:flex">
            <LeadCaptureButton className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-glow transition hover:-translate-y-0.5 hover:bg-brand/90" locale={locale}>
              {actions('createAccount')}
              <ArrowRight className="h-4 w-4" />
            </LeadCaptureButton>
          </div>

          <details className="group relative xl:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-center rounded-full border border-border bg-card p-3 shadow-sm transition hover:bg-brand-soft">
              <Menu className="h-5 w-5 text-navy" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(88vw,20rem)] rounded-3xl border border-border bg-card p-4 shadow-panel">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    className="block rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-brand-soft"
                    href={localizeHashPath(locale, localeRoutes.home, item.hash)}
                  >
                    {nav(item.key)}
                  </Link>
                ))}
              </div>
              <div className="mt-4 grid gap-2">
                <LeadCaptureButton className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-glow" locale={locale}>
                  {actions('createAccount')}
                  <ArrowRight className="h-4 w-4" />
                </LeadCaptureButton>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
