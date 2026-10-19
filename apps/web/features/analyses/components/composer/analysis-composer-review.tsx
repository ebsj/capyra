import type { ReactNode } from "react";
import { Archive, FileVideo, Link2, type LucideIcon } from "lucide-react";

import type { AnalysisSkillCatalogItem, SelectedAnalysisSkillId, SourceAssetItem } from "@/lib/models";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getSkillDisplayName } from "@/lib/analysis-skill-display";

import type { ComposerMode } from "../../types/analysis-composer.types";
import { formatFileSize } from "../../utils/format-file-size";

type Props = {
  assets: SourceAssetItem[];
  catalog: AnalysisSkillCatalogItem[];
  file: File | null;
  intent: string;
  mode: ComposerMode;
  selectedSkills: SelectedAnalysisSkillId[];
  selectedSourceAssetId: string | null;
  url: string;
};

export function AnalysisComposerReview({ assets, catalog, file, intent, mode, selectedSkills, selectedSourceAssetId, url }: Props) {
  const { t } = useI18n();
  const selectedAsset = assets.find((asset) => asset.id === selectedSourceAssetId) ?? null;
  const selectedCatalog = selectedSkills
    .map((skillId) => catalog.find((item) => item.id === skillId))
    .filter((item): item is AnalysisSkillCatalogItem => Boolean(item));

  return (
    <section aria-labelledby="analysis-review-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="analysis-review-heading" className="text-base font-semibold text-foreground">
          {t("Revise antes de iniciar")}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("Confira a origem do vídeo e as skills selecionadas. A análise começará assim que você confirmar.")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SummaryPanel title={t("Vídeo selecionado")}>
          <SourceSummary file={file} mode={mode} selectedAsset={selectedAsset} url={url} />
        </SummaryPanel>

        <SummaryPanel title={t("Skills selecionadas")}>
          {selectedCatalog.length > 0 ? (
            <ul className="grid gap-2">
              {selectedCatalog.map((item) => (
                <li key={item.id} className="rounded-[1rem] border border-border bg-background/72 px-3 py-2 text-sm font-semibold">
                  {getSkillDisplayName(item, t)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">{t("Nenhuma skill selecionada.")}</p>
          )}
        </SummaryPanel>
      </div>

      <SummaryPanel title={t("Objetivo informado")}>
        <p className="break-words text-sm leading-6 text-foreground">
          {intent.trim() || t("Sem objetivo informado. A análise seguirá o fluxo genérico.")}
        </p>
      </SummaryPanel>
    </section>
  );
}

function SummaryPanel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid gap-3 rounded-[1.55rem] border border-border bg-card/70 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function SourceSummary({
  file,
  mode,
  selectedAsset,
  url,
}: {
  file: File | null;
  mode: ComposerMode;
  selectedAsset: SourceAssetItem | null;
  url: string;
}) {
  const { t } = useI18n();

  if (mode === "file" && file) {
    return <SummaryLine icon={FileVideo} label={file.name} detail={formatFileSize(file.size)} />;
  }

  if (mode === "asset" && selectedAsset) {
    return (
      <SummaryLine
        icon={Archive}
        label={selectedAsset.sourceLabel}
        detail={`${formatFileSize(selectedAsset.contentLength)} · ${selectedAsset.analysisCount} ${selectedAsset.analysisCount === 1 ? t("análise") : t("análises")}`}
      />
    );
  }

  return <SummaryLine icon={Link2} label={t("URL pública")} detail={url.trim()} />;
}

function SummaryLine({
  detail,
  icon: Icon,
  label,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[1.15rem] bg-background/72 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
