"use client";

import Image from "next/image";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AnalysisComposerHeader() {
  const { t } = useI18n();

  return (
    <CardHeader className="gap-4 border-b border-border/70 bg-background/44 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <CardTitle className="font-display text-3xl leading-tight">
            {t("O que vamos analisar agora?")}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6">
            {t("Escolha a origem do vídeo, marque as skills oficiais e inicie quando tudo estiver pronto.")}
          </CardDescription>
        </div>
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border border-border bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--chart-2)/0.18),hsl(var(--chart-4)/0.34))]">
          <Image
            alt=""
            className="object-contain p-1.5 drop-shadow-[0_12px_22px_rgb(15_23_42/0.18)]"
            fill
            sizes="80px"
            src="/brand/capyra-camera.png"
          />
        </div>
      </div>
    </CardHeader>
  );
}
