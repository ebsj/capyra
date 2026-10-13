import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  FileJson,
  FileText,
  ListChecks,
  Sparkles,
  Upload
} from 'lucide-react';
import {getTranslations} from 'next-intl/server';

import {LeadCaptureButton} from '@/components/lead-capture';
import {
  AudienceCard,
  FeatureCard,
  HeroVisual,
  ResultMock,
  SectionBand,
  SectionHeading
} from '@/components/landing';
import {SiteFrame} from '@/components/site-frame';
import {locales, type Locale} from '@/i18n/routing';
import {localizeHashPath, localizePath, localeRoutes} from '@/lib/routes';

type PageProps = {
  params: Promise<{locale: Locale}>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'landing'});

  return {
    title: t('meta.title'),
    description: t('meta.description')
  };
}

export default async function HomePage({params}: PageProps) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'landing'});
  const actions = await getTranslations({locale, namespace: 'actions'});
  const common = await getTranslations({locale, namespace: 'common'});

  const integrationsPath = localizePath(locale, localeRoutes.integracoes);

  return (
    <SiteFrame locale={locale} pathname={localizePath(locale, localeRoutes.home)}>
      <section className="relative overflow-hidden bg-[rgb(var(--hero-bg))] px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgb(var(--brand)/0.24),transparent_34%),radial-gradient(circle_at_12%_82%,rgb(var(--sage)/0.16),transparent_32%)]"
        />
        <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_420px]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-sage">{t('hero.kicker')}</p>
            <h1 className="mt-4 font-display text-5xl font-black leading-none text-balance md:text-7xl">
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
              {t('hero.description')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LeadCaptureButton className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-brand-foreground shadow-glow transition hover:-translate-y-0.5 hover:bg-brand/90" locale={locale}>
                {actions('createAccount')}
                <ArrowRight className="h-4 w-4" />
              </LeadCaptureButton>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                href={localizeHashPath(locale, localeRoutes.home, 'integrations')}
              >
                {t('hero.secondaryCta')}
              </Link>
            </div>
          </div>

          <HeroVisual
            caption={t('hero.visualCaption')}
            chips={[
              {
                label: t('hero.chips.input.label'),
                tone: 'brand',
                value: t('hero.chips.input.value')
              },
              {
                label: t('hero.chips.skills.label'),
                tone: 'sage',
                value: t('hero.chips.skills.value')
              },
              {
                label: t('hero.chips.output.label'),
                tone: 'sand',
                value: t('hero.chips.output.value')
              }
            ]}
            imageAlt={common('visual.heroAlt')}
            imageSrc="/brand/capyra-camera.png"
          />
        </div>
      </section>

      <SectionBand id="overview">
        <SectionHeading
          description={t('overview.description')}
          kicker={t('overview.kicker')}
          title={t('overview.title')}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <FeatureCard
            cta={t('overview.structured.cta')}
            description={t('overview.structured.description')}
            href={localizeHashPath(locale, localeRoutes.home, 'results')}
            icon={ListChecks}
            kicker={t('overview.structured.kicker')}
            title={t('overview.structured.title')}
          />
          <FeatureCard
            cta={t('overview.skills.cta')}
            description={t('overview.skills.description')}
            href={localizeHashPath(locale, localeRoutes.home, 'workflow')}
            icon={Sparkles}
            kicker={t('overview.skills.kicker')}
            title={t('overview.skills.title')}
            tone="sage"
          />
          <FeatureCard
            cta={t('overview.snapshot.cta')}
            description={t('overview.snapshot.description')}
            href={localizeHashPath(locale, localeRoutes.home, 'results')}
            icon={FileText}
            kicker={t('overview.snapshot.kicker')}
            title={t('overview.snapshot.title')}
            tone="sand"
          />
        </div>
      </SectionBand>

      <SectionBand className="relative overflow-hidden" dark id="integrations">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--brand)/0.18),transparent_42%)]"
        />
        <div className="relative">
          <SectionHeading
            description={t('integrations.description')}
            kicker={t('integrations.kicker')}
            light
            title={t('integrations.title')}
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <FeatureCard
              cta={actions('openIntegration')}
              description={t('integrations.chatgpt.description')}
              href={`${integrationsPath}#chatgpt`}
              kicker="MCP"
              logo={{alt: 'OpenAI', src: '/brand/openai-logo.png'}}
              title={t('integrations.chatgpt.title')}
            />
            <FeatureCard
              cta={actions('openIntegration')}
              description={t('integrations.claude.description')}
              href={`${integrationsPath}#claude`}
              kicker="MCP"
              logo={{alt: 'Claude', src: '/brand/claude-logo.svg'}}
              title={t('integrations.claude.title')}
            />
          </div>
        </div>
      </SectionBand>

      <SectionBand id="workflow">
        <SectionHeading
          align="center"
          description={t('workflow.description')}
          kicker={t('workflow.kicker')}
          title={t('workflow.title')}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <FeatureCard
            description={t('workflow.input.description')}
            icon={Upload}
            kicker="01"
            title={t('workflow.input.title')}
          />
          <FeatureCard
            description={t('workflow.skills.description')}
            icon={BadgeCheck}
            kicker="02"
            title={t('workflow.skills.title')}
            tone="sage"
          />
          <FeatureCard
            description={t('workflow.result.description')}
            icon={FileJson}
            kicker="03"
            title={t('workflow.result.title')}
            tone="sand"
          />
        </div>
      </SectionBand>

      <SectionBand className="bg-muted/45" id="results">
        <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <SectionHeading
            description={t('results.description')}
            kicker={t('results.kicker')}
            title={t('results.title')}
          />
          <ResultMock
            description={t('results.mock.description')}
            evidence={[
              t('results.mock.evidence0'),
              t('results.mock.evidence1'),
              t('results.mock.evidence2')
            ]}
            evidenceTitle={t('results.mock.evidenceTitle')}
            eyebrow={t('results.mock.eyebrow')}
            metrics={[
              {
                label: t('results.mock.scoreLabel'),
                value: t('results.mock.scoreValue')
              },
              {
                label: t('results.mock.evidenceLabel'),
                value: t('results.mock.evidenceValue')
              },
              {
                label: t('results.mock.recommendationLabel'),
                value: t('results.mock.recommendationValue')
              },
              {
                label: t('results.mock.limitLabel'),
                value: t('results.mock.limitValue')
              }
            ]}
            snapshotDescription={t('results.mock.snapshotDescription')}
            snapshotTitle={t('results.mock.snapshotTitle')}
            title={t('results.mock.title')}
          />
        </div>
      </SectionBand>

      <SectionBand id="audience">
        <SectionHeading
          align="center"
          description={t('audience.description')}
          kicker={t('audience.kicker')}
          title={t('audience.title')}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <AudienceCard
            bullets={[
              t('audience.agency.bullet0'),
              t('audience.agency.bullet1'),
              t('audience.agency.bullet2')
            ]}
            description={t('audience.agency.description')}
            imageAlt=""
            imageSrc="/brand/capyra-workout.png"
            title={t('audience.agency.title')}
          />
          <AudienceCard
            bullets={[
              t('audience.creator.bullet0'),
              t('audience.creator.bullet1'),
              t('audience.creator.bullet2')
            ]}
            description={t('audience.creator.description')}
            imageAlt=""
            imageSrc="/brand/capyra-camera.png"
            title={t('audience.creator.title')}
            tone="sage"
          />
          <AudienceCard
            bullets={[
              t('audience.team.bullet0'),
              t('audience.team.bullet1'),
              t('audience.team.bullet2')
            ]}
            description={t('audience.team.description')}
            imageAlt=""
            imageSrc="/brand/capyra-suitcase-standing.png"
            title={t('audience.team.title')}
            tone="sand"
          />
        </div>
      </SectionBand>

      <section className="bg-brand px-4 py-16 text-brand-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-white/70">{t('cta.kicker')}</p>
            <h2 className="mt-3 font-display text-4xl font-black leading-tight text-white md:text-5xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">{t('cta.description')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LeadCaptureButton className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand shadow-panel transition hover:-translate-y-0.5" locale={locale}>
                {actions('createAccount')}
                <ArrowRight className="h-4 w-4" />
              </LeadCaptureButton>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/15"
                href={integrationsPath}
              >
                {t('cta.secondary')}
              </Link>
            </div>
          </div>
          <div className="relative h-28 w-28 shrink-0 md:h-36 md:w-36">
            <Image
              alt={common('visual.ctaAlt')}
              className="object-contain drop-shadow-[0_14px_28px_rgb(0_0_0/0.22)]"
              fill
              sizes="144px"
              src="/brand/capyra-watermelon.png"
            />
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
