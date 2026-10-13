"use client";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  description?: string;
  id: string;
  step: string;
  title: string;
};

export function AnalysisComposerStepHeader({ className, description, id, step, title }: Props) {
  return (
    <div className={cn("flex min-w-0 items-start gap-3", className)}>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold tabular-nums text-foreground">
        {step}
      </span>
      <div className="min-w-0">
        <p id={id} className="text-sm font-semibold text-foreground">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
