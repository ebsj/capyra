import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight, Check, type LucideIcon} from 'lucide-react';
import {getTranslations} from 'next-intl/server';

import {LeadCaptureButton} from '@/components/lead-capture';
import {Kicker, SectionBand, SectionHeading} from '@/components/landing';
import {SiteFrame} from '@/components/site-frame';
import {locales, type Locale} from '@/i18n/routing';
import {MCP_CLIENT_ID, MCP_ENDPOINT_URL, localizePath, localeRoutes} from '@/lib/routes';

type PageProps = {
  params: Promise<{locale: Locale}>;
};

type Guide = {
  id: 'chatgpt' | 'claude';
  icon?: LucideIcon;
  logo?: {
    alt: string;
    src: string;
  };
  mascot: {
    alt: string;
    src: string;
  };
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'integrations'});

  return {
    title: t('meta.title'),
    description: t('meta.description')
  };
}

export default async function IntegrationsPage({params}: PageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'integrations'});
  const actions = await getTranslations({locale, namespace: 'actions'});
  const common = await getTranslations({locale, namespace: 'common'});

  const guides: Guide[] = [
    {
      id: 'chatgpt',
      logo: {alt: 'OpenAI', src: '/brand/openai-logo.png'},
      mascot: {alt: '', src: '/brand/capyra-backpack.png'}
    },
    {
      id: 'claude',
      logo: {alt: 'Claude', src: '/brand/claude-logo.svg'},
      mascot: {alt: '', src: '/brand/capyra-avocado-standing.png'}
    },
  ];

  return (
    <SiteFrame locale={locale} pathname={localizePath(locale, localeRoutes.integracoes)}>
      <section className="relative overflow-hidden bg-[rgb(var(--hero-bg))] px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(var(--brand)/0.22),transparent_34%),radial-gradient(circle_at_10%_78%,rgb(var(--sage)/0.16),transparent_32%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 md:grid-cols-[1fr_260px]">
          <div className="max-w-3xl">
            <Kicker tone="light">{t('hero.kicker')}</Kicker>
            <h1 className="mt-4 font-display text-5xl font-black leading-none text-balance md:text-7xl">
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              {t('hero.description')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LeadCaptureButton className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-brand-foreground shadow-glow transition hover:-translate-y-0.5 hover:bg-brand/90" locale={locale}>
                {t('shared.webCta')}
                <ArrowRight className="h-4 w-4" />
              </LeadCaptureButton>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                href={localizePath(locale, localeRoutes.home)}
              >
                {actions('backHome')}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto h-48 w-48 md:h-60 md:w-60">
            <Image
              alt={common('visual.heroAlt')}
              className="object-contain drop-shadow-[0_18px_34px_rgb(0_0_0/0.32)]"
              fill
              priority
              sizes="240px"
              src="/brand/capyra-traveler.png"
            />
          </div>
        </div>
      </section>

      <SectionBand>
        <SectionHeading
          align="center"
          description={t('page.description')}
          kicker={t('page.kicker')}
          title={t('page.title')}
        />
        <div className="mt-10 grid gap-6">
          {guides.map((guide) => (
            <IntegrationGuide
              description={t(`${guide.id}.description`)}
              firstStep={t('shared.firstStep')}
              id={guide.id}
              icon={guide.icon}
              key={guide.id}
              kicker={t(`${guide.id}.kicker`)}
              logo={guide.logo}
              mascot={guide.mascot}
              step={t(`${guide.id}.step`)}
              title={t(`${guide.id}.title`)}
              whatYouGet={t('shared.whatYouGet')}
              configuration={t('shared.configuration')}
              configItems={[
                {label: t('shared.mcpUrl'), value: MCP_ENDPOINT_URL},
                {label: t('shared.clientId'), value: MCP_CLIENT_ID}
              ]}
              bullets={[
                t(`${guide.id}.bullet0`),
                t(`${guide.id}.bullet1`),
                t(`${guide.id}.bullet2`)
              ]}
            />
          ))}
        </div>
      </SectionBand>

      <section className="bg-brand px-4 py-14 text-brand-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-black leading-tight text-white">{t('cta.title')}</h2>
            <p className="mt-3 text-base leading-7 text-white/78">{t('cta.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <Image
                alt=""
                className="object-contain drop-shadow-[0_14px_28px_rgb(0_0_0/0.22)]"
                fill
                sizes="96px"
                src="/brand/capyra-suitcase-standing.png"
              />
            </div>
            <LeadCaptureButton className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand shadow-panel transition hover:-translate-y-0.5" locale={locale}>
              {t('shared.webCta')}
              <ArrowRight className="h-4 w-4" />
            </LeadCaptureButton>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}

function IntegrationGuide({
  id,
  icon: Icon,
  logo,
  mascot,
  kicker,
  title,
  description,
  whatYouGet,
  configuration,
  configItems,
  bullets,
  firstStep,
  step
}: {
  id?: string;
  icon?: LucideIcon;
  logo?: {
    alt: string;
    src: string;
  };
  mascot: {
    alt: string;
    src: string;
  };
  kicker: string;
  title: string;
  description: string;
  whatYouGet: string;
  configuration: string;
  configItems: Array<{label: string; value: string}>;
  bullets: string[];
  firstStep: string;
  step: string;
}) {
  return (
    <article
      className="scroll-mt-28 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
      id={id}
    >
      <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          {logo ? (
            <div className="relative h-16 w-16">
              <Image alt={logo.alt} className="object-contain" fill sizes="64px" src={logo.src} />
            </div>
          ) : Icon ? (
            <div className="inline-flex rounded-2xl border border-brand/15 bg-brand-soft p-3 text-brand">
              <Icon className="h-6 w-6" />
            </div>
          ) : null}
          <p className="mt-5 text-xs font-bold uppercase text-muted-foreground">{kicker}</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-navy">{title}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
          <div aria-hidden="true" className="relative mt-6 h-24 w-24 rounded-3xl bg-[linear-gradient(135deg,rgb(var(--brand-soft)),rgb(var(--sage-soft)),rgb(var(--sand)/0.36))]">
            <Image
              alt={mascot.alt}
              className="object-contain p-2 drop-shadow-[0_14px_24px_rgb(15_23_42/0.14)]"
              fill
              sizes="96px"
              src={mascot.src}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-bold uppercase text-muted-foreground">{whatYouGet}</p>
            <ul className="mt-4 grid gap-3">
              {bullets.map((bullet) => (
                <li className="flex gap-3 text-sm leading-6 text-foreground" key={bullet}>
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs font-bold uppercase text-muted-foreground">{configuration}</p>
            <dl className="mt-4 grid gap-3">
              {configItems.map((item) => (
                <div className="grid gap-1" key={item.label}>
                  <dt className="text-xs font-bold uppercase text-muted-foreground">{item.label}</dt>
                  <dd className="break-all rounded-xl border border-border bg-card px-3 py-2 font-mono text-sm text-navy">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-sage/30 bg-sage-soft p-5">
            <p className="text-xs font-bold uppercase text-emerald-900">{firstStep}</p>
            <p className="mt-3 text-sm leading-6 text-foreground">{step}</p>
          </div>
        </div>
      </div>
    </article>
  );
}
