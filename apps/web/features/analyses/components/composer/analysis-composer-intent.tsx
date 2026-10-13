"use client";

import { Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import { analysisIntentExamples } from "../../utils/analysis-intent-examples";

export const MAX_INTENT_LENGTH = 1000;

type Props = {
  intent: string;
  isPending: boolean;
  setError: (value: string | null) => void;
  setIntent: (value: string) => void;
};

export function AnalysisComposerIntent({ intent, isPending, setError, setIntent }: Props) {
  const { locale, t } = useI18n();
  const examples = analysisIntentExamples(locale);
  const normalizedLength = intent.trim().length;
  const isTooLong = normalizedLength > MAX_INTENT_LENGTH;

  return (
    <section className="grid gap-3 rounded-[1.55rem] border border-border bg-background/76 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Target aria-hidden="true" className="size-5" />
        </div>
        <div className="grid min-w-0 gap-1">
          <Label htmlFor="analysis-intent" className="text-sm font-semibold">
            {t("Objetivo do vídeo")}
          </Label>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("Descreva o objetivo, público, ação desejada ou dúvida que deve orientar a análise. Campo opcional, até 1000 caracteres.")}
          </p>
        </div>
      </div>

      <Textarea
        id="analysis-intent"
        name="analysis-intent"
        value={intent}
        maxLength={MAX_INTENT_LENGTH + 1}
        disabled={isPending}
        onChange={(event) => {
          setError(null);
          setIntent(event.target.value);
        }}
        placeholder={t("Quero saber se este vídeo convence pais a agendar uma aula experimental...")}
        className={cn(
          "min-h-32 resize-y rounded-2xl bg-card text-base leading-7",
          isTooLong ? "border-destructive focus-visible:ring-destructive" : null,
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className={isTooLong ? "font-medium text-destructive" : "text-muted-foreground"}>
          {isTooLong
            ? t("O objetivo deve ter no máximo 1000 caracteres.")
            : t("Se ficar em branco, a análise seguirá o fluxo genérico.")}
        </p>
        <span className={isTooLong ? "font-semibold text-destructive" : "text-muted-foreground"}>
          {normalizedLength}/{MAX_INTENT_LENGTH}
        </span>
      </div>

      <div className="grid gap-3 border-t border-border/70 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{t("Exemplos editáveis")}</p>
          {intent.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setIntent("");
              }}
              className="rounded-2xl"
            >
              <X aria-hidden="true" className="size-4" />
              {t("Remover objetivo")}
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <Button
              key={example.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setIntent(example.text);
              }}
              className="rounded-2xl"
            >
              <Target aria-hidden="true" className="size-4" />
              {example.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
