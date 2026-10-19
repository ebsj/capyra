"use client";
import { VIDEO_ANALYSIS_ENABLED } from "@/lib/features";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Destination } from "../types/social";
import { stateLabels, formatLabels, privacyLabels } from "../utils/state";
const settingLabels: Record<string, string> = {
  privacyLevel: "Privacidade",
  previewConfirmed: "Prévia confirmada",
  expressConsentGiven: "Publicação autorizada",
  allowComment: "Permitir comentários",
  allowDuet: "Permitir duetos",
  allowStitch: "Permitir Stitch",
  isAiGenerated: "Conteúdo gerado por IA",
  commercialContentType: "Conteúdo comercial",
  shareToFeed: "Compartilhar no feed",
  madeForKids: "Conteúdo para crianças",
  containsSyntheticMedia: "Contém mídia sintética",
  tags: "Tags",
  coverTimestampMs: "Instante da capa (ms)",
};
export function DestinationHistory({ destination }: { destination: Destination }) {
  const { t, locale } = useI18n();
  return (
    <details>
      <summary className="cursor-pointer font-medium">{t("Versões e tentativas")}</summary>
      <h4 className="my-3 font-medium">{t("Versões imutáveis")}</h4>
      <div className="grid gap-3">
        {destination.versions?.map((v) => (
          <article key={v.id} className="grid gap-3 rounded-xl border p-4 text-sm">
            <p className="text-muted-foreground">
              {new Date(v.createdAt).toLocaleString(locale)} · {v.id.slice(0, 8)}
            </p>
            {v.scheduledAt ? (
              <p>
                {new Date(v.scheduledAt).toLocaleString(locale, { timeZone: v.timeZone ?? "UTC" })} · {v.timeZone ?? "UTC"}
              </p>
            ) : null}
            <h5 className="font-semibold">{v.snapshot.title}</h5>
            <p>{t(formatLabels[v.snapshot.format] ?? v.snapshot.format)}</p>
            <p className="whitespace-pre-wrap">{v.snapshot.content}</p>
            <p className="whitespace-pre-wrap">{v.snapshot.description}</p>
            <p>
              {t("Mídias")}: {v.snapshot.mediaAssetIds.length}
            </p>
            {VIDEO_ANALYSIS_ENABLED && v.snapshot.analysisId ? (
              <p>
                {t("Análise vinculada")}: {v.snapshot.analysisId}
              </p>
            ) : null}
            <dl className="grid gap-1">
              {Object.entries(v.snapshot.settings).map(([key, value]) => (
                <div key={key} className="flex flex-wrap gap-2">
                  <dt className="font-medium">{t(settingLabels[key] ?? key)}:</dt>
                  <dd>
                    {typeof value === "boolean"
                      ? t(value ? "Sim" : "Não")
                      : Array.isArray(value)
                      ? value.join(", ")
                      : t(privacyLabels[String(value)] ?? String(value))}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <h4 className="my-3 font-medium">{t("Tentativas de entrega")}</h4>
      <div className="grid gap-3">
        {destination.attempts?.map((a) => (
          <article key={a.id} className="grid gap-2 rounded-xl border p-4 text-sm">
            <p className="font-medium">
              {t(stateLabels[a.status] ?? a.status)} · {a.id.slice(0, 8)}
            </p>
            <p>
              {t("Criada em")}: {new Date(a.createdAt).toLocaleString(locale)}
            </p>
            <p>
              {t("Atualizada em")}: {new Date(a.updatedAt).toLocaleString(locale)}
            </p>
            {a.lastError ? <p className="text-destructive">{a.lastError}</p> : null}
          </article>
        ))}
      </div>
    </details>
  );
}
