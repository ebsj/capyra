"use client";

import { MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { FeedbackReactionReviewResponseContract } from "@/lib/models";

import { formatDateTime } from "../../utils/analysis-utils";

export function AnalysisFeedbackReviewPanel({
  review,
}: {
  review: FeedbackReactionReviewResponseContract | null;
}) {
  const { locale, t } = useI18n();

  if (!review) {
    return null;
  }

  return (
    <section className="rounded-[1.75rem] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t("Feedback dos testers")}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-foreground">{t("Review contextual")}</h2>
        </div>
        <Badge variant="brandSoft">{review.pagination.returned}</Badge>
      </div>

      <div className="divide-y divide-border/70 px-5">
        {review.items.length > 0 ? (
          review.items.map((item) => {
            const Icon = item.reaction === "positive" ? ThumbsUp : item.reaction === "negative" ? ThumbsDown : MessageSquareText;
            const reactionBadgeVariant = item.reaction === "positive" ? "success" : item.reaction === "negative" ? "danger" : "outline";
            const reactionLabel = item.reaction === "positive" ? t("Útil") : item.reaction === "negative" ? t("Não útil") : t("Comentário");

            return (
              <article key={item.id} className="grid gap-3 py-4 first:pt-5 last:pb-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold leading-snug text-foreground">
                      {item.feedbackTitleSnapshot}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.testerName} · {item.testerEmail}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={reactionBadgeVariant}>
                      <Icon className="size-3.5" />
                      {reactionLabel}
                    </Badge>
                    <Badge variant="outline">{formatDateTime(item.updatedAt, locale)}</Badge>
                  </div>
                </div>
                {item.feedbackActionSnapshot ? (
                  <p className="text-sm leading-6 text-foreground">{item.feedbackActionSnapshot}</p>
                ) : null}
                {item.comment ? (
                  <p className="flex gap-2 rounded-[1.1rem] bg-background/75 p-3 text-sm leading-6 text-foreground">
                    <MessageSquareText className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item.comment}
                  </p>
                ) : null}
              </article>
            );
          })
        ) : (
          <div className="py-5 text-sm font-medium text-muted-foreground">
            {t("Nenhum feedback coletado nesta análise.")}
          </div>
        )}
      </div>
    </section>
  );
}
