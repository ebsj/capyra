import type {AnchorHTMLAttributes, ReactNode} from 'react';
import {headers} from 'next/headers';

import type {Locale} from '@/i18n/routing';
import {getLocalizedWebAppUrlFromHeaders} from '@/lib/routes';
import {TrackedLink} from '@/components/tracked-link';

type LeadCaptureButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  analyticsId?: string;
  children: ReactNode;
  href?: string;
  locale: Locale;
};

export async function LeadCaptureButton({
  analyticsId = 'lead_capture',
  children,
  className,
  href,
  locale,
  ...props
}: LeadCaptureButtonProps) {
  const resolvedHref = href ?? getLocalizedWebAppUrlFromHeaders(locale, await headers());

  return (
    <TrackedLink
      {...props}
      analyticsParams={{
        cta_id: analyticsId,
        locale,
        target_surface: 'web'
      }}
      className={className}
      href={resolvedHref}
    >
      {children}
    </TrackedLink>
  );
}
