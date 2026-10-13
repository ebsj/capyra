import { MessageSquareQuote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccountUserResponseContract } from "@/lib/models";

import {
  buildRecommendationFindings,
  RecommendationCard,
} from "./analysis-detail-findings";
import {
  EmptyInlineState,
  LOW_SCORE_THRESHOLD,
  type OnReactionChange,
  type ReactionStateByKey,
} from "./analysis-detail-shared";
import {
  formatEvidenceKind,
} from "../../utils/analysis-label-formatters";
import {
  formatScore,
  formatSeconds,
  type ExecutedSkillSection,
} from "../../utils/analysis-utils";

export function PropertyScoreList({ section }: { section: ExecutedSkillSection }) {
  const { locale, t } = useI18n();

  if (section.propertyScores.length === 0) {
    return <EmptyInlineState title={t("Nenhuma nota por propriedade.")} />;
  }

  return (
    <div className="divide-y divide-border/70">
      {section.propertyScores.map((property) => (
        <div key={property.propertyId} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_6rem] md:items-start">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{property.label}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{property.rationale}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {t("Confiança {confidence}", { confidence: property.confidence.toFixed(2) })}
            </p>
          </div>
          <Badge
            variant={property.score < LOW_SCORE_THRESHOLD ? "sand" : "brandSoft"}
            className="w-fit md:justify-self-end"
          >
            {formatScore(property.score, locale)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

export function SkillRecommendationList({
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
  const { t } = useI18n();
  const recommendations = buildRecommendationFindings([section]);

  if (recommendations.length === 0) {
    return <EmptyInlineState title={t("Nenhuma recomendação para esta skill.")} />;
  }

  return (
    <div className="divide-y divide-border/70">
      {recommendations.map((recommendation) => (
        <RecommendationCard
          key={recommendation.key}
          recommendation={recommendation}
          accessToken={accessToken}
          analysisId={analysisId}
          reviewer={reviewer}
          reactionsByKey={reactionsByKey}
          onReactionChange={onReactionChange}
        />
      ))}
    </div>
  );
}

export function EvidenceList({ section }: { section: ExecutedSkillSection }) {
  const { locale, t } = useI18n();

  if (section.evidence.length === 0) {
    return <EmptyInlineState title={t("Nenhuma evidência estruturada.")} />;
  }

  return (
    <div className="divide-y divide-border/70">
      {section.evidence.map((item) => (
        <div key={`${section.skillId}-${item.timestampSeconds}-${item.kind}-${item.observation}`} className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{formatSeconds(item.timestampSeconds, locale)}</Badge>
            <Badge variant="outline">{formatEvidenceKind(item.kind, locale)}</Badge>
          </div>
          <p className="mt-3 text-sm leading-7 text-foreground">{item.observation}</p>
          {item.transcriptQuote ? (
            <p className="mt-3 flex gap-2 text-sm leading-6 text-muted-foreground">
              <MessageSquareQuote className="mt-0.5 size-4 shrink-0" />
              {item.transcriptQuote}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TranscriptList({ section }: { section: ExecutedSkillSection }) {
  const { locale, t } = useI18n();

  if (section.transcriptExcerpts.length === 0) {
    return <EmptyInlineState title={t("Nenhum trecho vinculado.")} />;
  }

  return (
    <div className="divide-y divide-border/70">
      {section.transcriptExcerpts.map((excerpt) => (
        <div key={`${section.skillId}-${excerpt.startSeconds}-${excerpt.endSeconds}`} className="p-4">
          <Badge variant="info">
            {formatSeconds(excerpt.startSeconds, locale)} - {formatSeconds(excerpt.endSeconds, locale)}
          </Badge>
          <p className="mt-3 text-sm leading-7 text-foreground">{excerpt.text}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{excerpt.whyItMatters}</p>
        </div>
      ))}
    </div>
  );
}
