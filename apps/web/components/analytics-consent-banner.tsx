"use client";

import { useEffect, useState } from "react";

import {
  hasGoogleAnalyticsConfig,
  persistGoogleAnalyticsConsent,
  readStoredGoogleAnalyticsConsent,
} from "@/lib/google-analytics-client";
import { useI18n } from "@/components/i18n/i18n-provider";

export function AnalyticsConsentBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(hasGoogleAnalyticsConfig() && readStoredGoogleAnalyticsConsent() === null);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-2xl shadow-foreground/10 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-foreground">{t("Analytics")}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("Usamos Google Analytics para entender a jornada e melhorar o produto. Sem aceite, a tag permanece sem armazenamento de analytics.")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            className="rounded-2xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
            type="button"
            onClick={() => {
              persistGoogleAnalyticsConsent("denied");
              setVisible(false);
            }}
          >
            {t("Manter desativado")}
          </button>
          <button
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            type="button"
            onClick={() => {
              persistGoogleAnalyticsConsent("granted");
              setVisible(false);
            }}
          >
            {t("Aceitar analytics")}
          </button>
        </div>
      </div>
    </div>
  );
}
