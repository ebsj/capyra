import { SystemState } from "@/components/system-state";
import { localizePath } from "@/lib/i18n/config";
import { getServerTranslator } from "@/lib/i18n/server";
import { APP_HOME_PATH, VIDEO_ANALYSIS_ENABLED } from "@/lib/features";

export default async function NotFound() {
  const { locale, t } = await getServerTranslator();

  return (
    <SystemState
      tone="not-found"
      eyebrow="404"
      title={VIDEO_ANALYSIS_ENABLED ? t("Este caminho não levou a uma análise válida") : t("Página não encontrada")}
      description={VIDEO_ANALYSIS_ENABLED ? t("A análise pode ter sido removida ou o endereço pode estar incompleto.") : t("A página pode ter sido removida ou o endereço pode estar incompleto.")}
      primaryAction={{ label: VIDEO_ANALYSIS_ENABLED ? t("Ir para o dashboard") : t("Ir para Publicações"), href: localizePath(APP_HOME_PATH, locale) }}
      secondaryAction={{ label: t("Voltar ao login"), href: localizePath("/login", locale), variant: "outline" }}
    />
  );
}
