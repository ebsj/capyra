import type {ReactNode} from 'react';

import type {Locale} from '@/i18n/routing';
import {SiteFooter} from '@/components/site-footer';
import {SiteHeader} from '@/components/site-header';

type Props = {
  locale: Locale;
  pathname: string;
  children: ReactNode;
};

export async function SiteFrame({locale, pathname, children}: Props) {
  return (
    <div className="relative isolate overflow-hidden">
      <SiteHeader locale={locale} pathname={pathname} />
      <main className="pt-20">{children}</main>
      <SiteFooter locale={locale} pathname={pathname} />
    </div>
  );
}
