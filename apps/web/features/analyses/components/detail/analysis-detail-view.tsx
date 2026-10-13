"use client";

import { AnalysisBrandActions } from "./analysis-brand-actions";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileJson2,
  Target,
} from "lucide-react";

import { SystemState } from "@/components/system-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisDetailResponseContract } from "@/lib/models";

import {
  DeleteAnalysisDialog,
  getFailedAnalysisRecoveryState,
  PendingAnalysisRefresher,
} from "./analysis-detail-actions";
import { ArtifactsPanel } from "./analysis-detail-artifacts";
import { DataPanel } from "./analysis-detail-data";
import { buildRecommendationFindings } from "./analysis-detail-findings";
import { MetricTile } from "./analysis-detail-shared";
import { SkillsPanel } from "./analysis-detail-skills";
import { buildArtifactSections } from "../../utils/analysis-artifact-utils";
import {
  buildEvidenceHighlights,
  buildExecutedSkillSections,
  buildInterpretationNotes,
  buildWarningNotes,
  formatAnalysisSource,
  formatDateTime,
  formatScore,
  getAnalysisStatusLabel,
  getAnalysisStatusVariant,
} from "../../utils/analysis-utils";
import type {
  AccountUserResponseContract,
  MyFeedbackReactionContract,
  MyFeedbackReactionListResponseContract,
} from "@/lib/models";

type Props = {
  analysis: AnalysisDetailResponseContract;
  accessToken: string;
  reviewer: AccountUserResponseContract;
  myFeedbackReactions: MyFeedbackReactionListResponseContract;
};

function getScoreMetricTone(score: number | null | undefined) {
  if (typeof score !== "number") {
    return "scoreMid";
  }

  if (score > 7) {
    return "scoreHigh";
  }

  if (score > 5) {
    return "scoreMid";
  }

  return "scoreLow";
}

export function AnalysisDetailView({
  analysis,
  accessToken,
  reviewer,
  myFeedbackReactions,
}: Props) {
  const { href, locale, t } = useI18n();
  const [reactionsByKey, setReactionsByKey] = useState(() => {
    return Object.fromEntries(
      myFeedbackReactions.items.map((reaction) => [reaction.feedbackItemKey, reaction]),
    ) as Record<string, MyFeedbackReactionContract | undefined>;
  });
  const report = analysis.report;
  const overallScore = analysis.overallScore ?? report?.overallScore;
  const selectedSkillIds = analysis.selectedSkillIds ?? [];
  const executedSkills = analysis.executedSkills ?? [];
  const executedSkillSections = buildExecutedSkillSections(report, locale);
  const artifactSections = buildArtifactSections(analysis.artifacts.items);
  const interpretationNotes = buildInterpretationNotes(executedSkills);
  const warningNotes = buildWarningNotes(analysis);
  const evidenceHighlights = buildEvidenceHighlights(executedSkillSections);
  const failedRecoveryState = getFailedAnalysisRecoveryState(analysis, t);
  const recommendations = buildRecommendationFindings(executedSkillSections);
  const handleReactionChange = (feedbackItemKey: string, reaction: MyFeedbackReactionContract | null) => {
    setReactionsByKey((current) => {
      const next = { ...current };
      if (reaction) {
        next[feedbackItemKey] = reaction;
      } else {
        delete next[feedbackItemKey];
      }

      return next;
    });
  };

  return (
    <div className="grid gap-6">
      <AnalysisBrandActions analysis={analysis} accessToken={accessToken} />
      <PendingAnalysisRefresher status={analysis.status} />

      <Card className="overflow-hidden rounded-[1.9rem] border-border bg-card/92 shadow-xl shadow-foreground/5">
        <CardHeader className="gap-6 border-b border-border bg-card/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href={href("/analyses")}>
                <ArrowLeft data-icon="inline-start" />
                {t("Voltar")}
              </Link>
            </Button>
            <DeleteAnalysisDialog analysis={analysis} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_168px] lg:items-center">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={getAnalysisStatusVariant(analysis.status)}>
                  {getAnalysisStatusLabel(analysis.status, locale)}
                </Badge>
                <Badge variant="brandSoft">
                  {formatAnalysisSource(analysis.sourceLabel, analysis.sourceUrl)}
                </Badge>
                <Badge variant="sand">{formatDateTime(analysis.createdAt, locale)}</Badge>
              </div>
              <CardTitle className="max-w-5xl break-words font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {analysis.summary}
              </CardTitle>
            </div>
            <div aria-hidden="true" className="relative mx-auto hidden size-36 lg:block">
              <Image
                alt=""
                className="object-contain drop-shadow-[0_18px_30px_hsl(var(--foreground)/0.16)]"
                fill
                priority
                sizes="144px"
                src="/brand/capyra-workout.png"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricTile
              label={t("Nota")}
              value={formatScore(overallScore, locale)}
              icon={CheckCircle2}
              tone={getScoreMetricTone(overallScore)}
            />
            <MetricTile label={t("Recomendações")} value={recommendations.length} icon={Target} />
            <MetricTile label={t("Skills")} value={selectedSkillIds.length} icon={Target} />
            <MetricTile label={t("Artefatos")} value={analysis.artifacts.items.length} icon={FileJson2} />
          </div>
        </CardHeader>
      </Card>

      {failedRecoveryState ? (
        <SystemState
          tone="partial"
          title={failedRecoveryState.title}
          description={failedRecoveryState.description}
          primaryAction={{ label: t("Voltar ao histórico"), href: href("/analyses") }}
        />
      ) : null}

      <Tabs defaultValue="skills" className="grid min-w-0 gap-5">
        <TabsList
          variant="line"
          className="sticky top-20 z-20 h-auto w-full max-w-full overflow-x-auto rounded-[1.35rem] border border-border bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/84"
        >
          <TabsTrigger
            value="skills"
            className="min-h-11 rounded-[1rem] px-5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Skills
          </TabsTrigger>
          <TabsTrigger
            value="artifacts"
            className="min-h-11 rounded-[1rem] px-5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {t("Artefatos")}
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="min-h-11 rounded-[1rem] px-5 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {t("Dados")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-0">
          <SkillsPanel
            executedSkillSections={executedSkillSections}
            accessToken={accessToken}
            analysisId={analysis.id}
            reviewer={reviewer}
            reactionsByKey={reactionsByKey}
            onReactionChange={handleReactionChange}
          />
        </TabsContent>

        <TabsContent value="artifacts" className="mt-0">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <ArtifactsPanel artifactSections={artifactSections} />
          </section>
        </TabsContent>

        <TabsContent value="data" className="mt-0">
          <DataPanel
            analysis={analysis}
            selectedSkillIds={selectedSkillIds}
            executedSkillsCount={executedSkills.length}
            warningNotes={warningNotes}
            interpretationNotes={interpretationNotes}
            evidenceHighlights={evidenceHighlights}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
