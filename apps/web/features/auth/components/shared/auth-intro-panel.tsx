"use client";

import Image from "next/image";

import { useI18n } from "@/components/i18n/i18n-provider";
import { VIDEO_ANALYSIS_ENABLED } from "@/lib/features";

export function AuthIntroPanel() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
      <div className="relative space-y-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-border/80 bg-card/95 p-4 shadow-lg shadow-foreground/10 sm:h-28 sm:w-28">
            <Image
              src="/brand/logo.png"
              alt="Capyra"
              width={80}
              height={80}
              priority
              className="h-16 w-16 object-contain sm:h-20 sm:w-20"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t("Capyra Web")}</p>
            <p className="font-display text-xl font-semibold tracking-tight text-foreground">{t("Acesso flexível")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="max-w-xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {VIDEO_ANALYSIS_ENABLED
              ? t("Entre com Google ou link no e-mail e volte direto para a análise.")
              : t("Gerencie suas Marcas e publicações em um só lugar.")}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {t("Escolha o Google ou receba um link de acesso para continuar de onde parou, sem precisar lembrar da senha.")}
          </p>
        </div>
      </div>
    </div>
  );
}
