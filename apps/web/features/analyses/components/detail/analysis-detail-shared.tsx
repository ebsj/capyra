import type { ComponentProps, ReactNode } from "react";
import { ChevronDown, type LucideIcon, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AnalysisSkillId,
  FeedbackItemKind,
  MyFeedbackReactionContract,
  RecommendationContract,
} from "@/lib/models";

export const LOW_SCORE_THRESHOLD = 6;

export type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

export type FailureFinding = {
  key: string;
  title: string;
  body: string;
  source: string;
  variant: BadgeVariant;
  badge: string;
  score?: number;
};

export type RecommendationFinding = RecommendationContract & {
  key: string;
  feedbackItemKey: string;
  feedbackItemKind: FeedbackItemKind;
  label: string;
  skillId: AnalysisSkillId;
  itemIndex: number;
};

export type ReactionStateByKey = Record<string, MyFeedbackReactionContract | undefined>;

export type OnReactionChange = (feedbackItemKey: string, reaction: MyFeedbackReactionContract | null) => void;

export type FailedAnalysisRecoveryState = {
  title: string;
  description: ReactNode;
};

export function DetailGroup({
  title,
  children,
  defaultOpen = false,
  count,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  count?: number;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-t border-border/70 first:border-t-0"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {typeof count === "number" ? <Badge variant="outline">{count}</Badge> : null}
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
      </summary>
      <div className="py-4">
        <div className="min-w-0 rounded-[1.55rem] bg-background/70 p-4 text-foreground [&_.text-muted-foreground]:text-foreground/75 sm:p-5">
          {children}
        </div>
      </div>
    </details>
  );
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "primary" | "scoreHigh" | "scoreMid" | "scoreLow";
}) {
  return (
    <div
      className={
        tone === "scoreHigh"
          ? "rounded-[1.35rem] border border-chart-2/35 bg-chart-2/14 p-4 shadow-sm shadow-foreground/5"
          : tone === "scoreMid"
          ? "rounded-[1.35rem] border border-primary/25 bg-primary/[0.08] p-4 shadow-sm shadow-foreground/5"
          : tone === "scoreLow"
          ? "rounded-[1.35rem] border border-destructive/30 bg-destructive/[0.08] p-4 shadow-sm shadow-foreground/5"
          : tone === "primary"
          ? "rounded-[1.35rem] border border-primary/20 bg-primary/[0.08] p-4 shadow-sm"
          : "rounded-[1.35rem] border border-border bg-background/78 p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div
          className={
            tone === "scoreHigh"
              ? "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-chart-2/18 text-chart-2"
              : tone === "scoreMid"
              ? "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
              : tone === "scoreLow"
              ? "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
              : "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          }
        >
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function EmptyInlineState({ title }: { title: string }) {
  return (
    <div className="rounded-[1.35rem] border border-dashed border-border bg-background/70 p-5 text-sm font-medium text-muted-foreground">
      {title}
    </div>
  );
}
