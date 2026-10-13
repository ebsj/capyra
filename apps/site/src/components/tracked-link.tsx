'use client';

import type {AnchorHTMLAttributes, ReactNode} from 'react';
import {useEffect, useState} from 'react';

import {
  appendCurrentMarketingParams,
  trackGoogleAnalyticsEvent
} from '@/lib/google-analytics-client';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  analyticsParams?: Record<string, string | number | boolean | null | undefined>;
  children: ReactNode;
  href: string;
};

export function TrackedLink({analyticsParams, children, href, onClick, ...props}: Props) {
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setResolvedHref(appendCurrentMarketingParams(href));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [href]);

  return (
    <a
      {...props}
      href={resolvedHref}
      onClick={(event) => {
        const destination = new URL(resolvedHref, window.location.href);
        trackGoogleAnalyticsEvent('cta_click', {
          destination_host: destination.hostname,
          destination_path: destination.pathname,
          ...analyticsParams
        });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
