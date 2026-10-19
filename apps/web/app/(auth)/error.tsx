"use client";

import { SystemState } from "@/components/system-state";
import { useI18n } from "@/components/i18n/i18n-provider";

export default function AuthError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { href, t } = useI18n();

  return (
    <div className="p-6">
      <SystemState
        tone="error"
        eyebrow={t("Autenticação")}
        title={t("A área de autenticação falhou ao carregar")}
        description={error.message}
        primaryAction={{ label: t("Tentar novamente"), onClick: reset }}
        secondaryAction={{ label: t("Ir para login"), href: href("/login"), variant: "outline" }}
      />
    </div>
  );
}
