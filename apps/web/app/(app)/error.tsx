"use client";

import { SystemState } from "@/components/system-state";
import { useI18n } from "@/components/i18n/i18n-provider";
import { APP_HOME_PATH, VIDEO_ANALYSIS_ENABLED } from "@/lib/features";

export default function AppError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { href, t } = useI18n();
  const message = error.message.toLowerCase();
  const maybeExpiredSession =
    message.includes("401") ||
    message.includes("unauthorized") ||
    message.includes("forbidden");

  return (
    <SystemState
      tone="error"
      eyebrow="Workspace"
      title={t("Não foi possível recuperar esta superfície")}
      description={error.message}
      primaryAction={{ label: t("Recarregar"), onClick: reset }}
      secondaryAction={{
        label: maybeExpiredSession ? t("Voltar ao login") : VIDEO_ANALYSIS_ENABLED ? t("Ir para dashboard") : t("Ir para Publicações"),
        href: maybeExpiredSession
          ? `${href("/login")}?reason=session-expired&next=${encodeURIComponent(href(APP_HOME_PATH))}`
          : href(APP_HOME_PATH),
        variant: "outline",
      }}
    />
  );
}
