import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AccountUserResponseContract } from "@/lib/models";

import {
  EmptyInlineState,
  LOW_SCORE_THRESHOLD,
  type FailureFinding,
  type OnReactionChange,
  type ReactionStateByKey,
  type RecommendationFinding,
} from "./analysis-detail-shared";
import { AnalysisDetailReactionControls } from "./analysis-detail-reaction-controls";
import { formatPriority } from "../../utils/analysis-label-formatters";
import { buildRecommendationFeedbackItemKey } from "../../utils/analysis-feedback-items";
import {
  formatScore,
  getExecutedSkillStatusLabel,
  getExecutedSkillStatusVariant,
  type ExecutedSkillSection,
} from "../../utils/analysis-utils";
import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

function isHighPriority(priority: string) {
  return priority.trim().toLowerCase() === "high";
}

function getPriorityRank(priority: string) {
  const normalizedPriority = priority.trim().toLowerCase();

  if (normalizedPriority === "high") {
    return 0;
  }

  if (normalizedPriority === "medium") {
    return 1;
  }

  if (normalizedPriority === "low") {
    return 2;
  }

  return 3;
}

export function buildFailureFindings(sections: ExecutedSkillSection[], locale: Locale = "pt-br") {
  return sections.flatMap((section) => {
    const findings: FailureFinding[] = [];

    if (section.status !== "completed") {
      findings.push({
        key: `${section.skillId}-status`,
        title: `${section.label}: ${getExecutedSkillStatusLabel(section.status)}`,
        body: section.summary || section.detailedAssessment || translate(locale, "Skill sem resultado completo."),
        source: section.label,
        variant: getExecutedSkillStatusVariant(section.status),
        badge: translate(locale, "Status"),
      });
    }

    section.warnings.forEach((warning, index) => {
      findings.push({
        key: `${section.skillId}-warning-${index}`,
        title: translate(locale, "Aviso"),
        body: warning,
        source: section.label,
        variant: "danger",
        badge: translate(locale, "Aviso"),
      });
    });

    section.evidenceGaps.forEach((gap, index) => {
      findings.push({
        key: `${section.skillId}-gap-${index}`,
        title: translate(locale, "Lacuna de evidência"),
        body: gap,
        source: section.label,
        variant: "warning",
        badge: translate(locale, "Evidência"),
      });
    });

    section.propertyScores
      .filter((property) => property.score < LOW_SCORE_THRESHOLD)
      .forEach((property) => {
        findings.push({
          key: `${section.skillId}-score-${property.propertyId}`,
          title: property.label,
          body: property.rationale,
          source: section.label,
          variant: "sand",
          badge: translate(locale, "Nota baixa"),
          score: property.score,
        });
      });

    section.improvementOpportunities.forEach((opportunity, index) => {
      findings.push({
        key: `${section.skillId}-opportunity-${index}`,
        title: translate(locale, "Oportunidade de melhoria"),
        body: opportunity,
        source: section.label,
        variant: "brandSoft",
        badge: translate(locale, "Ajuste"),
      });
    });

    return findings;
  });
}

export function buildRecommendationFindings(sections: ExecutedSkillSection[]) {
  return sections.flatMap((section) =>
    section.recommendations.map((recommendation, index): RecommendationFinding => ({
      ...recommendation,
      key: buildRecommendationFeedbackItemKey(section.skillId, index),
      feedbackItemKey: buildRecommendationFeedbackItemKey(section.skillId, index),
      feedbackItemKind: "recommendation",
      label: section.label,
      skillId: section.skillId,
      itemIndex: index,
    })),
  ).sort((left, right) => getPriorityRank(left.priority) - getPriorityRank(right.priority));
}

export function FailureCard({ finding }: { finding: FailureFinding }) {
  const { locale, t } = useI18n();

  return (
    <div className="border-t border-border/70 py-4 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-foreground">{finding.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{finding.source}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={finding.variant}>{finding.badge}</Badge>
          {typeof finding.score === "number" ? (
            <Badge variant="outline">{t("Nota {score}", { score: formatScore(finding.score, locale) })}</Badge>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">{finding.body}</p>
    </div>
  );
}

export function RecommendationCard({
  recommendation,
  accessToken,
  analysisId,
  reviewer,
  reactionsByKey,
  onReactionChange,
}: {
  recommendation: RecommendationFinding;
  accessToken: string;
  analysisId: string;
  reviewer: AccountUserResponseContract;
  reactionsByKey: ReactionStateByKey;
  onReactionChange: OnReactionChange;
}) {
  const { locale } = useI18n();
  const defaultOpen = isHighPriority(recommendation.priority);
  const currentReaction = reactionsByKey[recommendation.feedbackItemKey];

  return (
    <details
      open={defaultOpen}
      className="group border-t border-border/70 py-4 first:border-t-0"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="break-words font-semibold leading-snug text-foreground">
            {recommendation.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={defaultOpen ? "warning" : "outline"}>{formatPriority(recommendation.priority, locale)}</Badge>
          <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="mt-3 grid w-full gap-4 rounded-[1.55rem] bg-background/70 p-4 text-foreground [&_.text-muted-foreground]:text-foreground/75 sm:p-5">
        <div className="grid gap-2">
          <p className="text-sm leading-6 text-foreground">{recommendation.action}</p>
          <p className="text-sm leading-6 text-muted-foreground">{recommendation.rationale}</p>
        </div>
        <AnalysisDetailReactionControls
          accessToken={accessToken}
          analysisId={analysisId}
          feedbackItemKey={recommendation.feedbackItemKey}
          feedbackItemKind={recommendation.feedbackItemKind}
          skillId={recommendation.skillId}
          itemIndex={recommendation.itemIndex}
          reviewer={reviewer}
          reaction={currentReaction}
          onReactionChange={onReactionChange}
        />
      </div>
    </details>
  );
}

export function ActionPanel({
  recommendations,
  accessToken,
  analysisId,
  reviewer,
  reactionsByKey,
  onReactionChange,
}: {
  recommendations: RecommendationFinding[];
  accessToken: string;
  analysisId: string;
  reviewer: AccountUserResponseContract;
  reactionsByKey: ReactionStateByKey;
  onReactionChange: OnReactionChange;
}) {
  const { t } = useI18n();

  return (
    <section className="rounded-[1.75rem] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t("Próximas ações")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">{t("Recomendações")}</h2>
        </div>
        <Badge variant="brandSoft">{recommendations.length}</Badge>
      </div>

      <div className="px-5">
        {recommendations.length > 0 ? (
          recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.key}
              recommendation={recommendation}
              accessToken={accessToken}
              analysisId={analysisId}
              reviewer={reviewer}
              reactionsByKey={reactionsByKey}
              onReactionChange={onReactionChange}
            />
          ))
        ) : (
          <div className="py-5">
            <EmptyInlineState title={t("Nenhuma recomendação retornada.")} />
          </div>
        )}
      </div>
    </section>
  );
}

export function ObservationsPanel({ observations }: { observations: FailureFinding[] }) {
  const { t } = useI18n();

  return (
    <section className="rounded-[1.75rem] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            {t("Pontos de atenção")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">{t("Observações")}</h2>
        </div>
        <Badge variant={observations.length > 0 ? "sand" : "sage"}>{observations.length}</Badge>
      </div>

      <div className="px-5">
        {observations.length > 0 ? (
          observations.map((finding) => <FailureCard key={finding.key} finding={finding} />)
        ) : (
          <div className="py-5">
            <EmptyInlineState title={t("Nenhuma observação acionável.")} />
          </div>
        )}
      </div>
    </section>
  );
}
