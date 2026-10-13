"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, Edit3, MessageSquareText, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
import { ApiError } from "@/lib/http";
import type {
  AnalysisSkillId,
  AccountUserResponseContract,
  FeedbackItemKind,
  FeedbackReactionValue,
  MyFeedbackReactionContract,
} from "@/lib/models";

import { clearAnalysisFeedbackReaction } from "../../api/clear-analysis-feedback-reaction";
import { upsertAnalysisFeedbackReaction } from "../../api/upsert-analysis-feedback-reaction";
import { formatDateTime } from "../../utils/analysis-utils";

type Props = {
  accessToken: string;
  analysisId: string;
  feedbackItemKey: string;
  feedbackItemKind: FeedbackItemKind;
  skillId: AnalysisSkillId;
  itemIndex: number;
  reviewer: AccountUserResponseContract;
  reaction?: MyFeedbackReactionContract;
  onReactionChange: (feedbackItemKey: string, reaction: MyFeedbackReactionContract | null) => void;
};

type SaveState = "idle" | "saving" | "saved" | "cleared" | "error";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.fieldErrors[0]?.message ?? error.message;
  }

  return fallback;
}

export function AnalysisDetailReactionControls({
  accessToken,
  analysisId,
  feedbackItemKey,
  feedbackItemKind,
  skillId,
  itemIndex,
  reviewer,
  reaction,
  onReactionChange,
}: Props) {
  const { locale, t } = useI18n();
  const [selectedReaction, setSelectedReaction] = useState<FeedbackReactionValue | null>(reaction?.reaction ?? null);
  const [comment, setComment] = useState(reaction?.comment ?? "");
  const [isEditingComment, setIsEditingComment] = useState(!reaction?.comment);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const disabled = saveState === "saving";
  const positiveLabel = t("Útil");
  const negativeLabel = t("Não útil");
  const commentLabel = reaction?.comment ? t("Editar comentário") : t("Adicionar comentário");
  const savedComment = reaction?.comment?.trim() ?? "";
  const hasSavedComment = savedComment.length > 0;
  const trimmedComment = comment.trim();
  const commentChanged = trimmedComment !== savedComment;
  const reactionUpdatedLabel = reaction
    ? t("Avaliada em {date}", { date: formatDateTime(reaction.updatedAt, locale) })
    : t("Ainda sem avaliação");
  const inactiveReactionClass =
    "size-9 rounded-md bg-muted/45 text-foreground/70 shadow-[0_3px_8px_hsl(var(--foreground)/0.035)] hover:bg-muted/70 hover:text-foreground";
  const positiveButtonClass = selectedReaction === "positive"
    ? "size-9 rounded-md bg-primary text-primary-foreground shadow-[0_6px_14px_hsl(var(--primary)/0.18)] hover:bg-primary/92"
    : inactiveReactionClass;
  const negativeButtonClass = selectedReaction === "negative"
    ? "size-9 rounded-md bg-destructive text-destructive-foreground shadow-[0_6px_14px_hsl(var(--destructive)/0.16)] hover:bg-destructive/90"
    : inactiveReactionClass;
  const reactionOptions = [
    { value: "positive" as const, label: positiveLabel, Icon: ThumbsUp, className: positiveButtonClass },
    { value: "negative" as const, label: negativeLabel, Icon: ThumbsDown, className: negativeButtonClass },
  ];

  useEffect(() => {
    setSelectedReaction(reaction?.reaction ?? null);
    setComment(reaction?.comment ?? "");
    setIsEditingComment(!reaction?.comment);
    setSaveState("idle");
    setMessage(null);
  }, [feedbackItemKey, reaction?.reaction, reaction?.comment, reaction?.updatedAt]);

  async function persistReaction(nextReaction: FeedbackReactionValue | null, nextComment: string | null) {
    setSaveState("saving");
    setMessage(null);

    try {
      const saved = await upsertAnalysisFeedbackReaction(accessToken, analysisId, feedbackItemKey, {
        feedbackItemKind,
        skillId,
        itemIndex,
        reaction: nextReaction,
        comment: nextComment,
      });
      setSelectedReaction(saved.reaction);
      setComment(saved.comment ?? "");
      onReactionChange(feedbackItemKey, saved);
      setSaveState("saved");
      return saved;
    } catch (error) {
      setSaveState("error");
      setMessage(getApiErrorMessage(error, t("Não foi possível salvar o feedback.")));
      return null;
    }
  }

  async function handleReactionSelect(nextReaction: FeedbackReactionValue) {
    if (nextReaction === selectedReaction) {
      if (savedComment.length > 0) {
        const saved = await persistReaction(null, savedComment);

        if (saved) {
          setIsEditingComment(false);
          setMessage(t("Avaliação removida; comentário mantido."));
        }
      } else {
        await handleClearFeedback(comment.trim().length > 0);
      }
      return;
    }

    const saved = await persistReaction(nextReaction, reaction?.comment ?? null);

    if (saved) {
      setIsEditingComment(!saved.comment);
      setMessage(t("Avaliação registrada nesta recomendação."));
    }
  }

  async function handleCommentSave() {
    if (!selectedReaction && trimmedComment.length === 0) {
      setSaveState("error");
      setMessage(t("Escreva um comentário ou escolha útil/não útil antes de salvar."));
      return;
    }

    const saved = await persistReaction(selectedReaction, trimmedComment.length > 0 ? trimmedComment : null);

    if (saved) {
      setIsEditingComment(!saved.comment);
      setMessage(saved.comment ? t("Comentário salvo nesta recomendação.") : t("Comentário apagado."));
    }
  }

  async function handleClearFeedback(preserveCommentDraft = false) {
    const draftComment = comment;
    setSaveState("saving");
    setMessage(null);

    try {
      await clearAnalysisFeedbackReaction(accessToken, analysisId, feedbackItemKey);
      setSelectedReaction(null);
      setComment(preserveCommentDraft ? draftComment : "");
      setIsEditingComment(true);
      onReactionChange(feedbackItemKey, null);
      setSaveState("cleared");
      setMessage(t("Avaliação removida desta recomendação."));
    } catch (error) {
      setSaveState("error");
      setMessage(getApiErrorMessage(error, t("Não foi possível remover o feedback.")));
    }
  }

  async function handleDeleteComment() {
    if (!selectedReaction) {
      await handleClearFeedback();
      return;
    }

    const saved = await persistReaction(selectedReaction, null);

    if (saved) {
      setIsEditingComment(true);
      setMessage(t("Comentário apagado."));
    }
  }

  return (
    <div className="mt-4 grid gap-4 overflow-hidden rounded-[1.35rem] bg-white px-4 py-4 shadow-sm dark:bg-card sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{t("Avaliação")}</p>
            {selectedReaction ? (
              <span
                className={
                  selectedReaction === "positive"
                    ? "rounded-md bg-[hsl(var(--chart-2)/0.14)] px-2.5 py-1 text-xs font-semibold text-[hsl(80_40%_30%)] dark:text-[hsl(80_50%_78%)]"
                    : "rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"
                }
              >
                {selectedReaction === "positive" ? positiveLabel : negativeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {reviewer.name} · {reviewer.email}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
            <Clock3 aria-hidden="true" className="size-3.5" />
            {reactionUpdatedLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2" role="group" aria-label={t("Avaliar recomendação")}>
          {reactionOptions.map(({ value, label, Icon, className }) => (
            <Button
              key={value}
              type="button"
              size="icon"
              aria-label={label}
              title={label}
              aria-pressed={selectedReaction === value}
              className={className}
              variant="ghost"
              disabled={disabled}
              onClick={() => handleReactionSelect(value)}
            >
              <Icon aria-hidden="true" className="size-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.15rem] bg-white p-3 dark:bg-card">
        {hasSavedComment && !isEditingComment ? (
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center bg-primary/10 rounded-md text-primary shadow-sm">
                <MessageSquareText aria-hidden="true" className="size-4" />
              </span>
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{savedComment}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => setIsEditingComment(true)}
              >
                <Edit3 aria-hidden="true" className="size-3.5" />
                {t("Editar")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                disabled={disabled}
                onClick={handleDeleteComment}
              >
                <Trash2 aria-hidden="true" className="size-3.5" />
                {t("Apagar")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <Textarea
              value={comment}
              maxLength={1000}
              disabled={disabled}
              aria-label={commentLabel}
              placeholder={t("Há algo que gostaria de sugerir?")}
              className="min-h-24 border border-border/35 bg-muted/20 shadow-none focus-visible:ring-2"
              onChange={(event) => setComment(event.target.value)}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t("{count}/1000 caracteres", { count: comment.length })}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {hasSavedComment ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={disabled}
                    onClick={() => {
                      setComment(savedComment);
                      setIsEditingComment(false);
                      setMessage(null);
                    }}
                  >
                    {t("Cancelar")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={disabled || trimmedComment.length === 0 || !commentChanged}
                  onClick={handleCommentSave}
                >
                  <Check aria-hidden="true" className="size-3.5" />
                  {t("Salvar comentário")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {message ? (
        <Alert variant={saveState === "error" ? "destructive" : "default"} className="py-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
