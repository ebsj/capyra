import type { ComposerStep } from "../../types/analysis-composer.types";
import { useI18n } from "@/components/i18n/i18n-provider";

const STEPS: Array<{ key: ComposerStep; label: string; title: string }> = [
  { key: "source", label: "1", title: "Vídeo" },
  { key: "skills", label: "2", title: "Skills" },
  { key: "review", label: "3", title: "Revisão" },
];

type Props = {
  currentStep: ComposerStep;
};

export function AnalysisComposerWizard({ currentStep }: Props) {
  const { t } = useI18n();
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <nav aria-label={t("Etapas da nova análise")} className="rounded-[1.55rem] bg-[hsl(var(--surface-strong)/0.72)] p-2">
      <ol className="grid gap-2 md:grid-cols-3">
        {STEPS.map((step, index) => {
          const isCurrent = step.key === currentStep;
          const isComplete = index < currentIndex;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className={[
                "flex items-center gap-3 rounded-[1.15rem] border px-3 py-2 text-sm transition-colors",
                isCurrent
                  ? "border-primary bg-card text-foreground shadow-sm"
                  : isComplete
                    ? "border-transparent bg-primary/10 text-foreground"
                    : "border-transparent text-muted-foreground",
              ].join(" ")}
            >
              <span
                className={[
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCurrent || isComplete ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                ].join(" ")}
              >
                {step.label}
              </span>
              <span className="font-semibold">{t(step.title)}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
