"use client";

import Link from "next/link";
import { ArrowRight, Clock3, FileVideo2, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalysisListItemContract } from "@/lib/models";
import { useI18n } from "@/components/i18n/i18n-provider";

import {
  formatAnalysisSource,
  formatDateTime,
  formatRelativeDate,
  formatScore,
  getAnalysisSkillBadgeVariant,
  getAnalysisSkillLabel,
  getAnalysisStatusLabel,
  getAnalysisStatusVariant,
} from "../utils/analysis-utils";

type Props = {
  item: AnalysisListItemContract;
  featured?: boolean;
};

function getScoreTileClass(score: number | null | undefined) {
  if (typeof score !== "number") {
    return "rounded-2xl border border-border/85 bg-surface-muted/55 p-3";
  }

  if (score > 7) {
    return "rounded-2xl border border-[hsl(var(--chart-2)/0.35)] bg-[hsl(var(--chart-2)/0.14)] p-3";
  }

  if (score > 5) {
    return "rounded-2xl border border-primary/25 bg-primary/[0.08] p-3";
  }

  return "rounded-2xl border border-destructive/30 bg-destructive/[0.08] p-3";
}

function getScoreValueClass(score: number | null | undefined) {
  if (typeof score !== "number") {
    return "mt-2 text-xl font-semibold text-foreground";
  }

  if (score > 7) {
    return "mt-2 text-xl font-semibold text-chart-2";
  }

  if (score > 5) {
    return "mt-2 text-xl font-semibold text-primary";
  }

  return "mt-2 text-xl font-semibold text-destructive";
}

export function AnalysisCard({ item, featured = false }: Props) {
  const { href, locale, t } = useI18n();
  const executedCount = item.executedSkills?.length ?? 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border-border/95 bg-card shadow-[0_14px_34px_hsl(var(--foreground)/0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_38px_hsl(var(--foreground)/0.09)]">
      <CardHeader className="gap-4 border-b border-border/75 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant={getAnalysisStatusVariant(item.status)}>
            {getAnalysisStatusLabel(item.status, locale)}
          </Badge>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock3 data-icon="inline-start" />
            {formatRelativeDate(item.createdAt, locale)}
          </span>
        </div>

        <div className="grid gap-3">
          <CardTitle className="line-clamp-3 break-words font-display text-2xl leading-tight text-foreground">
            {item.summary}
          </CardTitle>
          <p className="line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
            {formatAnalysisSource(item.sourceLabel, item.sourceUrl)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid flex-1 gap-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className={getScoreTileClass(item.overallScore)}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("Nota")}
            </p>
            <p className={getScoreValueClass(item.overallScore)}>{formatScore(item.overallScore, locale)}</p>
          </div>
          <div className="rounded-2xl border border-border/85 bg-surface-muted/55 p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("Skills")}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">{item.selectedSkillIds.length}</p>
          </div>
          <div className="rounded-2xl border border-border/85 bg-surface-muted/55 p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("Exec.")}
            </p>
            <p className="mt-2 text-xl font-semibold text-foreground">{executedCount}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.selectedSkillIds.length > 0 ? (
            item.selectedSkillIds.slice(0, featured ? 6 : 4).map((skillId) => (
              <Badge
                key={`${item.id}-${skillId}`}
                variant={getAnalysisSkillBadgeVariant(skillId)}
                className="h-7 max-w-full rounded-xl px-3 text-sm leading-none"
              >
                <span className="truncate">{getAnalysisSkillLabel(skillId, locale)}</span>
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="h-7 rounded-xl px-3 text-sm leading-none">
              {t("Sem skills selecionadas")}
            </Badge>
          )}
          {item.selectedSkillIds.length > (featured ? 6 : 4) ? (
            <Badge variant="secondary" className="h-7 rounded-xl px-3 text-sm leading-none">
              +{item.selectedSkillIds.length - (featured ? 6 : 4)}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{t("Criada em:")}</span>{" "}
            {formatDateTime(item.createdAt, locale)}
          </p>
          {item.completedAt ? (
            <p>
              <span className="font-medium text-foreground">{t("Concluída em:")}</span>{" "}
              {formatDateTime(item.completedAt, locale)}
            </p>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="items-center justify-between gap-3 border-t border-border/75 bg-surface-strong/58 p-5">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {item.status === "completed" ? <ListChecks data-icon="inline-start" /> : <FileVideo2 data-icon="inline-start" />}
          {t("Análise")}
        </span>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href={href(`/analyses/${item.id}`)}>
            {t("Abrir detalhe")}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
