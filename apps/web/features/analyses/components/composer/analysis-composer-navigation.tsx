import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import type { ComposerStep } from "../../types/analysis-composer.types";

type Props = {
  catalogCount: number;
  currentStep: ComposerStep;
  isCatalogLoading: boolean;
  isPending: boolean;
  onBack: () => void;
};

function getHelperText(currentStep: ComposerStep, isCatalogLoading: boolean, catalogCount: number, t: (source: string) => string) {
  if (currentStep === "source") {
    return t("Escolha a origem do vídeo para continuar.");
  }

  if (currentStep === "skills") {
    return isCatalogLoading || catalogCount === 0
      ? t("Aguarde o catálogo oficial de skills carregar.")
      : t("Marque as skills que devem orientar a leitura.");
  }

  return t("Ao iniciar, a origem escolhida será enviada com estas skills.");
}

export function AnalysisComposerNavigation({
  catalogCount,
  currentStep,
  isCatalogLoading,
  isPending,
  onBack,
}: Props) {
  const { t } = useI18n();
  const isReview = currentStep === "review";
  const isFirstStep = currentStep === "source";
  const catalogUnavailable = isCatalogLoading || catalogCount === 0;

  return (
    <div className="flex flex-col gap-3 rounded-[1.55rem] border border-border bg-[hsl(var(--surface-strong)/0.8)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-muted-foreground">{getHelperText(currentStep, isCatalogLoading, catalogCount, t)}</p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={isFirstStep || isPending}
          onClick={onBack}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-2xl px-5")}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("Voltar")}
        </button>

        <button
          type="submit"
          disabled={isPending || (isReview && catalogUnavailable)}
          className={cn(buttonVariants(), "h-11 rounded-2xl px-6 sm:min-w-44")}
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
          ) : isReview ? (
            <Send aria-hidden="true" className="size-4" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          {isPending ? t("Enviando...") : isReview ? t("Iniciar análise") : t("Avançar")}
        </button>
      </div>
    </div>
  );
}
