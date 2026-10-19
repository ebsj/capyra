import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight, Check, type LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

import {cn} from '@/lib/utils';

export function Kicker({children, tone = 'brand'}: {children: ReactNode; tone?: 'brand' | 'light'}) {
  return (
    <p
      className={cn(
        'text-xs font-bold uppercase',
        tone === 'light' ? 'text-sage' : 'text-brand'
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = 'left',
  light = false
}: {
  kicker: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  light?: boolean;
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <Kicker tone={light ? 'light' : 'brand'}>{kicker}</Kicker>
      <h2
        className={cn(
          'mt-3 font-display text-3xl font-extrabold leading-tight text-balance md:text-5xl',
          light ? 'text-white' : 'text-navy'
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className={cn('mt-4 text-base leading-7 md:text-lg', light ? 'text-white/68' : 'text-muted-foreground')}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function SectionBand({
  id,
  children,
  className,
  dark = false
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section
      className={cn(
        'scroll-mt-20 px-4 py-16 sm:px-6 md:py-20 lg:px-8',
        dark ? 'bg-[rgb(var(--hero-bg))] text-white' : 'bg-transparent',
        className
      )}
      id={id}
    >
      <div className="mx-auto w-full max-w-[1200px]">{children}</div>
    </section>
  );
}

export function FeatureCard({
  icon: Icon,
  logo,
  kicker,
  title,
  description,
  cta,
  href,
  tone = 'brand'
}: {
  icon?: LucideIcon;
  logo?: {
    alt: string;
    src: string;
  };
  kicker: string;
  title: string;
  description: string;
  cta?: string;
  href?: string;
  tone?: 'brand' | 'sage' | 'sand';
}) {
  const toneClass = {
    brand: 'bg-brand-soft text-brand border-brand/15',
    sage: 'bg-sage-soft text-emerald-800 border-sage/25',
    sand: 'bg-sand/30 text-cocoa border-cocoa/15'
  } as const;
  const cardToneClass = {
    brand: 'bg-card',
    sage: 'border-sage/30 bg-sage-soft/70',
    sand: 'border-cocoa/15 bg-sand/25'
  } as const;

  const content = (
    <div className={cn('group flex h-full flex-col rounded-3xl border border-border p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-panel', cardToneClass[tone])}>
      {logo ? (
        <div className="relative h-14 w-14">
          <Image alt={logo.alt} className="object-contain" fill sizes="56px" src={logo.src} />
        </div>
      ) : Icon ? (
        <div className={cn('inline-flex w-fit rounded-2xl border p-3', toneClass[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <p className="mt-5 text-xs font-bold uppercase text-muted-foreground">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-navy">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
      {cta ? (
        <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand transition group-hover:translate-x-1">
          {cta}
          <ArrowRight className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  );

  return href ? (
    <Link className="block h-full" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}

export function HeroVisual({
  imageAlt,
  imageSrc = '/brand/capyra-camera.png',
  caption,
  chips
}: {
  imageAlt: string;
  imageSrc?: string;
  caption: string;
  chips: Array<{label: string; value: string; tone: 'brand' | 'sage' | 'sand'}>;
}) {
  const toneClass = {
    brand: 'text-sky-200',
    sage: 'text-lime-200',
    sand: 'text-sand'
  } as const;

  return (
    <div className="relative min-h-[23rem] overflow-hidden rounded-[2rem] border border-[rgb(var(--hero-border))] bg-[rgb(var(--hero-card))] p-5 shadow-[0_24px_64px_rgb(0_0_0/0.28)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_68%_28%,rgb(var(--brand)/0.28),transparent_34%),radial-gradient(circle_at_18%_80%,rgb(var(--sage)/0.18),transparent_34%)]"
      />
      <div className="relative z-10 flex h-full min-h-[20rem] flex-col justify-between gap-6">
        <p className="text-xs font-bold uppercase text-white/52">{caption}</p>
        <div className="pointer-events-none absolute inset-x-0 top-9 flex justify-center">
          <div className="relative h-44 w-44 animate-float sm:h-56 sm:w-56">
            <Image
              alt={imageAlt}
              className="object-contain drop-shadow-[0_18px_34px_rgb(0_0_0/0.32)]"
              fill
              priority
              sizes="(max-width: 640px) 176px, 224px"
              src={imageSrc}
            />
          </div>
        </div>
        <div className="mt-36 grid gap-3 sm:mt-44">
          {chips.map((chip) => (
            <div
              className="rounded-2xl border border-[rgb(var(--hero-border))] bg-white/5 px-4 py-3 backdrop-blur"
              key={chip.label}
            >
              <p className="text-xs font-bold uppercase text-white/48">{chip.label}</p>
              <p className={cn('mt-1 font-display text-xl font-extrabold leading-tight', toneClass[chip.tone])}>
                {chip.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResultMock({
  eyebrow,
  title,
  description,
  metrics,
  evidenceTitle,
  evidence,
  snapshotTitle,
  snapshotDescription
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: Array<{label: string; value: string}>;
  evidenceTitle: string;
  evidence: string[];
  snapshotTitle: string;
  snapshotDescription: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-panel md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Kicker>{eyebrow}</Kicker>
          <h3 className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy">{title}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        <span className="w-fit rounded-full border border-brand/20 bg-brand-soft px-4 py-2 text-xs font-bold uppercase text-brand">
          Snapshot
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div className="min-w-0 rounded-2xl border border-border bg-background p-4" key={metric.label}>
            <p className="break-words text-xs font-bold uppercase text-muted-foreground">{metric.label}</p>
            <p className="mt-2 break-words text-balance font-display text-xl font-extrabold leading-tight text-navy md:text-2xl">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-sage/30 bg-sage-soft p-5">
        <p className="text-xs font-bold uppercase text-emerald-900">{evidenceTitle}</p>
        <ul className="mt-3 grid gap-3">
          {evidence.map((item) => (
            <li className="flex gap-3 text-sm leading-6 text-foreground" key={item}>
              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-800" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-5">
        <p className="font-display text-xl font-bold text-navy">{snapshotTitle}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{snapshotDescription}</p>
      </div>
    </div>
  );
}

export function AudienceCard({
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  tone = 'brand'
}: {
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  tone?: 'brand' | 'sage' | 'sand';
}) {
  const toneClass = {
    brand: 'bg-card',
    sage: 'bg-sage-soft border-sage/30',
    sand: 'bg-sand/25 border-cocoa/15'
  } as const;

  return (
    <div className={cn('rounded-3xl border border-border p-6 shadow-sm', toneClass[tone])}>
      <div className="relative h-16 w-16">
        <Image alt={imageAlt} className="object-contain" fill sizes="64px" src={imageSrc} />
      </div>
      <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight text-navy">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <ul className="mt-5 grid gap-3">
        {bullets.map((bullet) => (
          <li className="flex gap-3 text-sm leading-6 text-foreground" key={bullet}>
            <Check className="mt-1 h-4 w-4 shrink-0 text-brand" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
