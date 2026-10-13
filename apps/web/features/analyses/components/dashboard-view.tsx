"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Clock3, ListChecks, Plus, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisListItemContract, AuthSessionResponseContract } from "@/lib/models";
import { useI18n } from "@/components/i18n/i18n-provider";
import { AnalysisCard } from "./analysis-card";

import {
  buildStatusBreakdown,
  formatScore,
} from "../utils/analysis-utils";

type Props = {
  items: AnalysisListItemContract[];
  session: AuthSessionResponseContract;
};

function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  tone?: "brand" | "sage" | "sand" | "navy";
}) {
  const toneClass = {
    brand: "bg-primary/10 text-primary",
    sage: "bg-[hsl(var(--chart-2)/0.16)] text-[hsl(80_40%_30%)]",
    sand: "bg-[hsl(var(--chart-4)/0.46)] text-[hsl(25_39%_26%)]",
    navy: "bg-[hsl(var(--chart-5))] text-primary-foreground",
  } as const;

  return (
    <div className="rounded-[1.25rem] border border-border bg-background/75 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold leading-none text-foreground">{value}</p>
        </div>
        <div className={`flex size-9 items-center justify-center rounded-xl ${toneClass[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function DashboardView({ items, session }: Props) {
  const { href, t } = useI18n();
  const [analyses, setAnalyses] = useState(items);
  const userFirstName = session.user.name.split(" ")[0] || session.user.name;
  const statusBreakdown = useMemo(() => buildStatusBreakdown(analyses), [analyses]);
  const activeAnalyses = analyses.filter((item) => item.status === "pending").slice(0, 9);
  const actionRequiredCount = analyses.filter((item) => item.status !== "completed").length;
  const averageScore =
    analyses
      .map((item) => item.overallScore)
      .filter((value): value is number => typeof value === "number")
      .reduce((sum, value, _, values) => sum + value / values.length, 0) || null;

  useEffect(() => {
    setAnalyses(items);
  }, [items]);

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden rounded-[2rem] border-border bg-card/90 shadow-xl shadow-foreground/5">
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-center">
            <div className="grid max-w-3xl gap-2">
              <div className="grid gap-2">
                <h1 className="text-balance font-display text-3xl font-semibold leading-tight text-foreground lg:text-[2rem]">
                  {t("Olá, {name}. Acompanhe o que ainda está rodando e volte rápido aos relatórios.", { name: userFirstName })}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {t("O dashboard agora fica concentrado no estado do trabalho. Para enviar uma nova fonte, use o fluxo dedicado de criação.")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label={t("Total")}
              value={analyses.length}
              icon={Activity}
            />
            <MetricTile
              label={t("Concluídas")}
              value={statusBreakdown.find((entry) => entry.status === "completed")?.value ?? 0}
              icon={ListChecks}
              tone="sage"
            />
            <MetricTile
              label={t("Atenção")}
              value={actionRequiredCount}
              icon={TriangleAlert}
              tone="sand"
            />
            <MetricTile
              label={t("Nota média")}
              value={formatScore(averageScore)}
              icon={Clock3}
              tone="navy"
            />
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {t("Em andamento")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-foreground">
              {t("Análises pendentes")}
            </h2>
          </div>
          <Badge variant="outline">{activeAnalyses.length} {t("em andamento")}</Badge>
        </div>

        {activeAnalyses.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {activeAnalyses.map((item, index) => (
              <AnalysisCard key={item.id} item={item} featured={index === 0} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden rounded-[1.75rem] border-border bg-surface-strong shadow-sm">
            <CardContent className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_148px] md:items-center">
              <div className="grid max-w-2xl gap-3">
                <p className="font-display text-2xl font-semibold text-foreground">
                  {t("Nenhuma análise em andamento")}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("Quando uma análise estiver processando, ela aparece aqui com progresso, skills selecionadas e acesso ao detalhe.")}
                </p>
                <Button asChild className="mt-1 w-fit rounded-2xl">
                  <Link href={href("/analyses/new")}>
                    {t("Iniciar nova análise")}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
              <div aria-hidden="true" className="relative mx-auto size-32">
                <Image
                  alt=""
                  className="object-contain opacity-95"
                  fill
                  sizes="112px"
                  src="/brand/capyra-sleeping.png"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
