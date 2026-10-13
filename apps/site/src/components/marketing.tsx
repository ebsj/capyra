import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react';
import type {ReactNode} from 'react';

import {cn} from '@/lib/utils';

export function Section({
  kicker,
  title,
  description,
  children,
  className,
  align = 'left'
}: {
  kicker?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <section className={cn('py-14 md:py-18', className)}>
      <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">{kicker}</p>
        ) : null}
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy text-balance md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}

type HeroVisualPanelLabels = {
  followers: string;
  views: string;
  consistency: string;
};

const defaultHeroVisualPanelLabels: HeroVisualPanelLabels = {
  followers: 'Followers',
  views: 'Views',
  consistency: 'Consistency'
};

export function FeatureCard({
  icon,
  kicker,
  title,
  description,
  href,
  cta
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  const content = (
    <div className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-panel">
      <div className="inline-flex rounded-2xl border border-border bg-brand-soft p-3 text-brand">
        {icon}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {kicker}
      </p>
      <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      {cta ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand transition group-hover:translate-x-1">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link className="block h-full" href={href}>
        {content}
      </Link>
    );
  }

  return content;
}

export function PlatformCoverage({
  kicker,
  title,
  description,
  items,
  className
}: {
  kicker: string;
  title: string;
  description: string;
  items: ReadonlyArray<{
    name: string;
    status: string;
    description: string;
    tone?: 'brand' | 'sage' | 'sand';
  }>;
  className?: string;
}) {
  const toneClass = {
    brand: 'bg-brand-soft text-brand',
    sage: 'bg-sage-soft text-emerald-900',
    sand: 'bg-[rgb(var(--sand)/0.36)] text-cocoa'
  } as const;

  return (
    <div
      className={cn(
        'rounded-[2rem] border border-border bg-card p-5 shadow-sm md:p-6',
        className
      )}
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{kicker}</p>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-navy text-balance md:text-3xl">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">{description}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.name}
            className={cn(
              'rounded-2xl border border-border p-4 shadow-sm',
              toneClass[item.tone ?? 'brand']
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold tracking-tight">{item.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                  {item.status}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 opacity-80">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricBand({
  items
}: {
  items: Array<{value: string; label: string; icon: ReactNode}>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'flex h-full rounded-3xl border border-border bg-card px-5 py-4 shadow-sm md:px-6 md:py-5',
            index === items.length - 1 && 'md:col-span-2'
          )}
        >
          <div className="flex w-full items-start gap-3">
            <span className="inline-flex rounded-2xl border border-border bg-brand-soft p-2 text-brand">
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground text-balance">
                {item.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroVisual({
  imageSrc,
  caption,
  chips,
  panelLabels,
  imageAlt = 'Capyra mascot',
  className
}: {
  imageSrc: string;
  caption: string;
  chips: Array<{label: string; value: string; tone?: 'brand' | 'sage' | 'sand'}>;
  panelLabels?: Partial<HeroVisualPanelLabels>;
  imageAlt?: string;
  className?: string;
}) {
  const resolvedPanelLabels = {
    ...defaultHeroVisualPanelLabels,
    ...panelLabels
  };
  const toneClass = {
    brand: 'bg-brand-soft text-brand',
    sage: 'bg-sage-soft text-emerald-900',
    sand: 'bg-[rgb(var(--sand)/0.35)] text-cocoa'
  } as const;

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-[2.25rem] border border-border bg-card p-3 shadow-panel sm:p-4 md:p-6',
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgb(var(--brand)/0.16),transparent_34%),radial-gradient(circle_at_20%_75%,rgb(var(--sage)/0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.85),rgba(255,255,255,0.2))]"
      />
      <div className="absolute inset-x-8 top-5 h-24 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative grid gap-4">
        <div className="rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(250,246,239,0.92))] p-3 shadow-sm sm:p-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col justify-between rounded-[1.5rem] border border-border bg-card px-3 py-3 sm:px-4 sm:py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.22em]">
                {caption}
              </p>
              <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
                {chips.map((chip) => (
                  <div
                    key={chip.label}
                    className={cn(
                      'rounded-2xl border border-border px-3 py-2.5 sm:px-4 sm:py-3',
                      toneClass[chip.tone ?? 'brand']
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70 sm:text-[11px] sm:tracking-[0.2em]">
                      {chip.label}
                    </p>
                    <p className="mt-1 font-display text-base font-bold tracking-tight sm:text-lg">
                      {chip.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,rgba(1,118,211,0.18),rgba(152,184,88,0.14))]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.7),transparent_30%),radial-gradient(circle_at_30%_75%,rgba(255,255,255,0.45),transparent_24%)]" />
              <div className="absolute inset-x-5 top-5 h-10 rounded-full bg-white/30 blur-2xl" />
              <div className="relative flex min-h-[18rem] flex-col px-3 pb-3 pt-4 sm:min-h-[21rem] sm:px-0 sm:pb-0 sm:pt-0 lg:min-h-[24rem]">
                <div className="flex min-h-[11rem] items-center justify-center pt-2 sm:absolute sm:inset-0 sm:px-4 sm:pb-24 sm:pt-4 lg:pb-28">
                <div className="relative h-[10.5rem] w-[10.5rem] animate-float sm:h-[16.5rem] sm:w-[16.5rem] lg:h-[17rem] lg:w-[17rem]">
                    <Image
                      alt={imageAlt}
                      className="object-contain drop-shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
                      fill
                      sizes="(max-width: 640px) 52vw, (max-width: 768px) 70vw, 320px"
                      src={imageSrc}
                    />
                  </div>
                </div>
                <div className="mt-auto grid gap-2 sm:absolute sm:inset-x-4 sm:bottom-4 sm:grid-cols-2 sm:gap-3">
                  <MiniPanel label={resolvedPanelLabels.followers} value="+18%" />
                  <MiniPanel label={resolvedPanelLabels.views} value="+31%" />
                  <div className="sm:col-span-2">
                    <MiniPanel
                      label={resolvedPanelLabels.consistency}
                      value="92"
                      suffix="/100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SplitPanel({
  kicker,
  title,
  description,
  reverse = false,
  visual,
  children
}: {
  kicker: string;
  title: string;
  description: string;
  reverse?: boolean;
  visual: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-8 rounded-[2.25rem] border border-border bg-card p-5 shadow-sm md:p-8 lg:grid-cols-2 lg:items-center',
        reverse && 'lg:[&>*:first-child]:order-2'
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{kicker}</p>
        <h3 className="mt-3 font-display text-3xl font-bold tracking-tight text-navy text-balance md:text-4xl">
          {title}
        </h3>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
          {description}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
      {visual}
    </div>
  );
}

export function DashboardMock({
  title,
  subtitle,
  bars,
  badgeLabel = 'Live baseline'
}: {
  title: string;
  subtitle: string;
  bars: Array<{label: string; value: string; progress: number; tone?: 'brand' | 'sage' | 'sand'}>;
  badgeLabel?: string;
}) {
  const toneClass = {
    brand: 'bg-brand',
    sage: 'bg-sage',
    sand: 'bg-sand'
  } as const;

  return (
    <div className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(250,246,239,0.92))] p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {subtitle}
          </p>
          <h4 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy">{title}</h4>
        </div>
        <div className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          {badgeLabel}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{bar.label}</span>
              <span className="font-semibold text-navy">{bar.value}</span>
            </div>
            <div className="h-3 rounded-full bg-muted">
              <div
                className={cn('h-3 rounded-full', toneClass[bar.tone ?? 'brand'])}
                style={{width: `${bar.progress}%`}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportSnapshot({
  token,
  title,
  subtitle,
  bullets,
  rows,
  labels
}: {
  token: string;
  title: string;
  subtitle: string;
  bullets: string[];
  rows: Array<{label: string; metric: string; delta: string}>;
  labels?: Partial<{
    eyebrow: string;
    tokenPrefix: string;
    momentum: string;
    summary: string;
    frozenBadge: string;
    frozenTitle: string;
    frozenDescription: string;
  }>;
}) {
  const resolvedLabels = {
    eyebrow: 'Public report',
    tokenPrefix: 'Token',
    momentum: '30/60/90 momentum',
    summary: 'Summary bullets',
    frozenBadge: 'Frozen',
    frozenTitle: 'Frozen snapshot',
    frozenDescription:
      'This report is frozen at generation time and can be revoked or regenerated with a new token later.',
    ...labels
  };

  return (
    <div className="rounded-[2.25rem] border border-border bg-card p-4 shadow-panel sm:p-5 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand sm:text-xs sm:tracking-[0.24em]">
            {resolvedLabels.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy text-balance sm:mt-3 sm:text-3xl md:text-4xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7 md:text-lg">
            {subtitle}
          </p>
        </div>
        <div className="self-start rounded-full border border-border bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand sm:px-4 sm:py-2 sm:text-sm">
          {resolvedLabels.tokenPrefix} {token}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,246,239,0.95))] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-border bg-background px-3.5 py-3.5 sm:px-4 sm:py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.22em]">
                  {row.label}
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-2 sm:gap-4">
                  <span className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
                    {row.metric}
                  </span>
                  <span className="rounded-full bg-sage-soft px-2.5 py-1 text-[11px] font-semibold text-emerald-900 sm:text-xs">
                    {row.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-3.5 sm:mt-5 sm:p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="h-4 w-4 text-brand" />
              {resolvedLabels.momentum}
            </div>
            <div className="mt-4 flex h-24 items-end gap-2 sm:h-32 sm:gap-3">
              {[40, 52, 48, 63, 71, 77, 84, 90].map((height, index) => (
                <div key={index} className="flex-1">
                  <div
                    className="rounded-t-2xl bg-[linear-gradient(180deg,rgb(var(--brand)),rgb(var(--sage)))]"
                    style={{height: `${height}%`}}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,rgba(235,243,219,0.75),rgba(255,252,247,0.96))] p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs sm:tracking-[0.22em]">
              {resolvedLabels.summary}
            </p>
            <ul className="mt-3 space-y-3 sm:mt-4">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-6 text-foreground">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-brand" />
              {resolvedLabels.frozenTitle}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {resolvedLabels.frozenDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({
  items
}: {
  items: readonly {question: string; answer: string}[];
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-3xl border border-border bg-card p-5 shadow-sm"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-left list-none">
            <span className="font-semibold text-foreground">{item.question}</span>
            <span className="rounded-full border border-border bg-brand-soft p-2 text-brand transition group-open:rotate-45">
              <Sparkles className="h-4 w-4" />
            </span>
          </summary>
          <p className="mt-4 pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function AudienceCard({
  title,
  description,
  bullets,
  icon,
  tone = 'brand'
}: {
  title: string;
  description: string;
  bullets: readonly string[];
  icon: ReactNode;
  tone?: 'brand' | 'sage' | 'sand';
}) {
  const toneClass = {
    brand: 'bg-brand-soft text-brand',
    sage: 'bg-sage-soft text-emerald-900',
    sand: 'bg-[rgb(var(--sand)/0.4)] text-cocoa'
  } as const;

  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-panel">
      <div className={cn('inline-flex rounded-2xl border border-border p-3', toneClass[tone])}>
        {icon}
      </div>
      <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-navy">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <ul className="mt-5 space-y-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex gap-3 text-sm leading-6 text-foreground">
            <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-brand" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniPanel({
  label,
  value,
  suffix
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex min-h-[4.75rem] flex-col justify-between rounded-2xl border border-white/60 bg-white/80 px-3 py-2 shadow-sm backdrop-blur sm:min-h-[6rem] sm:px-4 sm:py-3">
      <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-muted-foreground sm:text-[10px]">
        {label}
      </p>
      <p className="mt-1 break-words font-display text-base font-bold leading-none tracking-tight text-navy sm:text-lg">
        {value}
        {suffix ? (
          <span className="text-xs font-semibold text-muted-foreground sm:text-sm">{suffix}</span>
        ) : null}
      </p>
    </div>
  );
}
