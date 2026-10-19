import Link from 'next/link';

import type {Locale} from '@/i18n/routing';
import {switchLocalePath} from '@/lib/routes';
import {cn} from '@/lib/utils';

type Props = {
  locale: Locale;
  pathname: string;
  ptLabel: string;
  enLabel: string;
  esLabel: string;
  className?: string;
  tone?: 'light' | 'dark';
};

const localeLinkClasses = 'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition';

export function LanguageSwitcher({
  locale,
  pathname,
  ptLabel,
  enLabel,
  esLabel,
  className,
  tone = 'light'
}: Props) {
  const links: Array<{locale: Locale; label: string}> = [
    {locale: 'pt-br', label: ptLabel},
    {locale: 'en', label: enLabel},
    {locale: 'es', label: esLabel}
  ];

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border p-1 shadow-sm',
        tone === 'dark' ? 'border-white/10 bg-white/5' : 'border-border bg-card',
        className
      )}
    >
      {links.map((item) => (
        <Link
          key={item.locale}
          aria-current={locale === item.locale ? 'page' : undefined}
          className={cn(
            localeLinkClasses,
            locale === item.locale
              ? 'bg-brand text-brand-foreground shadow-sm'
              : tone === 'dark'
                ? 'text-white/55 hover:text-white'
                : 'text-muted-foreground hover:text-foreground'
          )}
          href={switchLocalePath(pathname, item.locale)}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
