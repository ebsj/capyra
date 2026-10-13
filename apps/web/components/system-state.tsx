import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Compass,
  FolderSearch,
  Inbox,
  LoaderCircle,
  type LucideProps,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SystemStateTone =
  | "loading"
  | "error"
  | "empty"
  | "no-results"
  | "not-found"
  | "partial";

type SystemStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

type SystemStateProps = {
  tone: SystemStateTone;
  eyebrow?: string;
  title: string;
  description: ReactNode;
  primaryAction?: SystemStateAction;
  secondaryAction?: SystemStateAction;
  className?: string;
  children?: ReactNode;
};

const toneConfig: Record<
  SystemStateTone,
  {
    icon: ComponentType<LucideProps>;
    accentClassName: string;
    borderClassName: string;
  }
> = {
  loading: {
    icon: LoaderCircle,
    accentClassName: "text-primary",
    borderClassName: "border-border bg-card/80",
  },
  error: {
    icon: AlertCircle,
    accentClassName: "text-destructive",
    borderClassName: "border-destructive/20 bg-destructive/5",
  },
  empty: {
    icon: Inbox,
    accentClassName: "text-primary",
    borderClassName: "border-dashed border-border bg-card/70",
  },
  "no-results": {
    icon: FolderSearch,
    accentClassName: "text-primary",
    borderClassName: "border-dashed border-border bg-card/70",
  },
  "not-found": {
    icon: Compass,
    accentClassName: "text-primary",
    borderClassName: "border-dashed border-border bg-card/75",
  },
  partial: {
    icon: AlertCircle,
    accentClassName: "text-amber-600 dark:text-amber-300",
    borderClassName: "border-amber-300/40 bg-amber-500/10",
  },
};

function renderAction(action: SystemStateAction, key: string) {
  const variant = action.variant ?? "default";

  if (action.href) {
    const isInternal = action.href.startsWith("/");

    return (
      <Button key={key} asChild variant={variant}>
        {isInternal ? <Link href={action.href}>{action.label}</Link> : <a href={action.href}>{action.label}</a>}
      </Button>
    );
  }

  return (
    <Button key={key} type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function SystemState({
  tone,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  children,
}: SystemStateProps) {
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <Card className={cn("overflow-hidden shadow-sm", config.borderClassName, className)}>
      <CardContent className="p-0">
        <Empty className="border-0 px-6 py-10 sm:px-10">
          <EmptyHeader className="max-w-2xl gap-3">
            <EmptyMedia
              variant="icon"
              className={cn("size-12 rounded-2xl bg-background/90 shadow-sm [&_svg]:size-5", config.accentClassName)}
            >
              <Icon className={cn(tone === "loading" && "animate-spin")} />
            </EmptyMedia>
            {eyebrow ? (
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </div>
            ) : null}
            <EmptyTitle className="font-display text-2xl text-balance text-card-foreground">
              {title}
            </EmptyTitle>
            <EmptyDescription className="max-w-xl text-sm leading-6">{description}</EmptyDescription>
          </EmptyHeader>

          {primaryAction || secondaryAction || children ? (
            <EmptyContent className="max-w-2xl gap-5">
              {primaryAction || secondaryAction ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {primaryAction ? renderAction(primaryAction, "primary") : null}
                  {secondaryAction ? renderAction(secondaryAction, "secondary") : null}
                </div>
              ) : null}
              {children}
            </EmptyContent>
          ) : null}
        </Empty>
      </CardContent>
    </Card>
  );
}

export function SystemStateSkeleton({
  surface = "workspace",
  className,
}: {
  surface?: "auth" | "workspace" | "detail";
  className?: string;
}) {
  if (surface === "auth") {
    return (
      <div className={cn("grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]", className)}>
        <div className="hidden border-r border-border bg-card/40 p-8 lg:block">
          <div className="grid h-full gap-6">
            <div className="grid gap-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-28 rounded-[1.5rem]" />
              <Skeleton className="h-28 rounded-[1.5rem]" />
              <Skeleton className="h-28 rounded-[1.5rem]" />
              <Skeleton className="h-28 rounded-[1.5rem]" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 lg:p-10">
          <Card className="w-full max-w-md border-border shadow-sm">
            <CardContent className="grid gap-4 p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (surface === "detail") {
    return (
      <div className={cn("grid gap-6", className)}>
        <Card className="border-border shadow-sm">
          <CardContent className="grid gap-5 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <div className="grid gap-3 md:grid-cols-4">
              <Skeleton className="h-24 rounded-[1.5rem]" />
              <Skeleton className="h-24 rounded-[1.5rem]" />
              <Skeleton className="h-24 rounded-[1.5rem]" />
              <Skeleton className="h-24 rounded-[1.5rem]" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Skeleton className="min-h-[380px] rounded-[1.75rem]" />
          <Skeleton className="min-h-[380px] rounded-[1.75rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)}>
      <Card className="border-border shadow-sm">
        <CardContent className="grid gap-5 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-28 rounded-[1.5rem]" />
            <Skeleton className="h-28 rounded-[1.5rem]" />
            <Skeleton className="h-28 rounded-[1.5rem]" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Skeleton className="min-h-[360px] rounded-[1.75rem]" />
        <Skeleton className="min-h-[360px] rounded-[1.75rem]" />
      </div>
    </div>
  );
}
