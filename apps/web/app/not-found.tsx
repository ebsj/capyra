import { SystemState } from "@/components/system-state";
import { localizePath } from "@/lib/i18n/config";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getServerTranslator();

  return (
    <SystemState
      tone="not-found"
      eyebrow="404"
      title={t("Este caminho não levou a uma análise válida")}
      description={t("A análise pode ter sido removida ou o endereço pode estar incompleto.")}
      primaryAction={{ label: t("Ir para o dashboard"), href: localizePath("/dashboard", locale) }}
      secondaryAction={{ label: t("Voltar ao login"), href: localizePath("/login", locale), variant: "outline" }}
    />
  );
}
