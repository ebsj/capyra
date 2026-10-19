"use client";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { SourceAssetItemContract } from "@/lib/models";
export function MediaPreview({ asset }: { asset: SourceAssetItemContract }) {
  const { t } = useI18n();
  const url = `/api/v1/source-assets/${asset.id}/content`;
  return asset.mediaKind === "image" ? (
    <img src={url} alt={asset.sourceLabel ?? t("Mídia")} className="max-h-72 w-full rounded-xl bg-muted object-contain" />
  ) : (
    <video src={url} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-muted" aria-label={asset.sourceLabel ?? t("Vídeo")} />
  );
}
