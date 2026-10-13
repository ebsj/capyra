"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccountUserResponseContract } from "@/lib/models";

import {
  buildFailureFindings,
  FailureCard,
} from "./analysis-detail-findings";
import {
  EvidenceList,
  PropertyScoreList,
  SkillRecommendationList,
  TranscriptList,
} from "./analysis-detail-skill-lists";
import {
  DetailGroup,
  EmptyInlineState,
  type OnReactionChange,
  type ReactionStateByKey,
} from "./analysis-detail-shared";
import {
  formatScore,
  getAnalysisSkillBadgeVariant,
  getExecutedSkillStatusLabel,
  getExecutedSkillStatusVariant,
  type ExecutedSkillSection,
} from "../../utils/analysis-utils";

function SkillFailures({ section }: { section: ExecutedSkillSection }) {
  const { locale, t } = useI18n();
  const failures = buildFailureFindings([section], locale);

  if (failures.length === 0) {
    return <EmptyInlineState title={t("Sem observações acionáveis nesta skill.")} />;
  }

  return (
    <div className="grid gap-3">
      {failures.map((finding) => (
        <FailureCard key={finding.key} finding={finding} />
      ))}
    </div>
  );
}

function ExecutedSkillDetail({
  section,
  accessToken,
  analysisId,
  reviewer,
  reactionsByKey,
  onReactionChange,
}: {
  section: ExecutedSkillSection;
  accessToken: string;
  analysisId: string;
  reviewer: AccountUserResponseContract;
  reactionsByKey: ReactionStateByKey;
  onReactionChange: OnReactionChange;
}) {
  const { locale, t } = useI18n();

  return (
    <div className="rounded-[1.75rem] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/80 p-5">
        <div className="min-w-0">
          <h2 className="break-words font-display text-3xl font-semibold text-foreground">{section.label}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getAnalysisSkillBadgeVariant(section.skillId)}>
            {t("Nota {score}", { score: formatScore(section.skillScore, locale) })}
          </Badge>
          <Badge variant={getExecutedSkillStatusVariant(section.status)}>
            {getExecutedSkillStatusLabel(section.status, locale)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="max-w-4xl text-sm leading-7 text-foreground">
          {section.summary}
        </div>

        <DetailGroup title={t("Recomendações")} count={section.recommendations.length} defaultOpen>
          <SkillRecommendationList
            section={section}
            accessToken={accessToken}
            analysisId={analysisId}
            reviewer={reviewer}
            reactionsByKey={reactionsByKey}
            onReactionChange={onReactionChange}
          />
        </DetailGroup>

        <DetailGroup title={t("Notas por propriedade")} count={section.propertyScores.length} defaultOpen>
          <PropertyScoreList section={section} />
        </DetailGroup>

        <DetailGroup title={t("Avaliação detalhada")}>
          <p className="text-sm leading-7 text-foreground">{section.detailedAssessment}</p>
        </DetailGroup>

        <DetailGroup title={t("Observações")} count={buildFailureFindings([section], locale).length}>
          <SkillFailures section={section} />
        </DetailGroup>

        <DetailGroup title={t("Evidências")} count={section.evidence.length}>
          <EvidenceList section={section} />
        </DetailGroup>

        <DetailGroup title={t("Trechos da transcrição")} count={section.transcriptExcerpts.length}>
          <TranscriptList section={section} />
        </DetailGroup>

        {section.disclaimer ? (
          <DetailGroup title={t("Limite de interpretação")}>
            <p className="text-sm leading-7 text-muted-foreground">{section.disclaimer}</p>
          </DetailGroup>
        ) : null}
      </div>
    </div>
  );
}

export function SkillsPanel({
  executedSkillSections,
  accessToken,
  analysisId,
  reviewer,
  reactionsByKey,
  onReactionChange,
}: {
  executedSkillSections: ExecutedSkillSection[];
  accessToken: string;
  analysisId: string;
  reviewer: AccountUserResponseContract;
  reactionsByKey: ReactionStateByKey;
  onReactionChange: OnReactionChange;
}) {
  const { locale, t } = useI18n();
  const [selectedSkillId, setSelectedSkillId] = useState<ExecutedSkillSection["skillId"] | undefined>(
    executedSkillSections[0]?.skillId,
  );
  const selectedSection = useMemo(
    () => executedSkillSections.find((section) => section.skillId === selectedSkillId) ?? executedSkillSections[0],
    [executedSkillSections, selectedSkillId],
  );

  if (executedSkillSections.length === 0) {
    return (
      <Card className="rounded-[1.75rem] border-border shadow-sm">
        <CardContent className="p-5">
          <EmptyInlineState title={t("Nenhuma skill executada.")} />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:items-start">
      <div className="lg:sticky lg:top-40">
        <div className="mb-3 flex items-center justify-between gap-3 lg:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("Skills")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
              {t("Conteúdo da análise")}
            </h2>
          </div>
        </div>

        <div className="lg:hidden">
          <Select
            value={selectedSection.skillId}
            onValueChange={(value) => setSelectedSkillId(value as ExecutedSkillSection["skillId"])}
          >
            <SelectTrigger className="h-11 rounded-2xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {executedSkillSections.map((section) => (
                <SelectItem key={section.skillId} value={section.skillId}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden rounded-[1.5rem] border border-border bg-card p-2 shadow-sm lg:grid">
          {executedSkillSections.map((section) => {
            const selected = section.skillId === selectedSection.skillId;

            return (
              <button
                key={section.skillId}
                type="button"
                onClick={() => setSelectedSkillId(section.skillId)}
                className={cn(
                  "grid gap-2 rounded-[1.1rem] p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-background/80",
                )}
              >
                <span className="font-semibold">{section.label}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={selected ? "brandSoft" : "outline"}>
                    {formatScore(section.skillScore, locale)}
                  </Badge>
                  <Badge variant={getExecutedSkillStatusVariant(section.status)}>
                    {getExecutedSkillStatusLabel(section.status, locale)}
                  </Badge>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ExecutedSkillDetail
        section={selectedSection}
        accessToken={accessToken}
        analysisId={analysisId}
        reviewer={reviewer}
        reactionsByKey={reactionsByKey}
        onReactionChange={onReactionChange}
      />
    </section>
  );
}
