import type { DragEvent, RefObject } from "react";

import type { AnalysisSkillCatalogItem, SelectedAnalysisSkillId, SourceAssetItem } from "@/lib/models";

import type { ComposerMode, ComposerStep } from "../../types/analysis-composer.types";
import { AnalysisComposerIntent } from "./analysis-composer-intent";
import { AnalysisComposerReview } from "./analysis-composer-review";
import { AnalysisComposerSkills } from "./analysis-composer-skills";
import { AnalysisComposerSourceTabs } from "./analysis-composer-source-tabs";
import { AnalysisComposerStepHeader } from "./analysis-composer-step";
import { useI18n } from "@/components/i18n/i18n-provider";

type Props = {
  assets: SourceAssetItem[];
  assetsError: string | null;
  catalog: AnalysisSkillCatalogItem[];
  catalogError: string | null;
  file: File | null;
  fileInputId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isAssetsLoading: boolean;
  isCatalogLoading: boolean;
  isDraggingFile: boolean;
  isPending: boolean;
  intent: string;
  mode: ComposerMode;
  selectedSkills: SelectedAnalysisSkillId[];
  selectedSourceAssetId: string | null;
  setError: (value: string | null) => void;
  setFile: (value: File | null) => void;
  setIsDraggingFile: (value: boolean) => void;
  setIntent: (value: string) => void;
  setMode: (value: ComposerMode) => void;
  setSelectedSkills: (update: (current: SelectedAnalysisSkillId[]) => SelectedAnalysisSkillId[]) => void;
  setSelectedSourceAssetId: (value: string | null) => void;
  setUrl: (value: string) => void;
  step: ComposerStep;
  url: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onSelectFile: (file: File | null) => void;
};

export function AnalysisComposerStepContent(props: Props) {
  const { t } = useI18n();

  return (
    <section className="grid gap-5 rounded-[1.65rem] border border-border bg-background/58 p-4 sm:p-5">
      {props.step === "source" ? <SourceStep {...props} t={t} /> : null}
      {props.step === "skills" ? <SkillsStep {...props} t={t} /> : null}
      {props.step === "review" ? <ReviewStep {...props} /> : null}
    </section>
  );
}

function SourceStep(props: Props & { t: (source: string) => string }) {
  return (
    <>
      <AnalysisComposerStepHeader
        id="analysis-source-heading"
        step="1"
        title={props.t("Escolha o vídeo")}
        description={props.t("Use uma URL pública, envie um arquivo ou reutilize um vídeo salvo.")}
      />
      <AnalysisComposerSourceTabs {...props} />
    </>
  );
}

function SkillsStep({
  catalog,
  catalogError,
  isCatalogLoading,
  isPending,
  selectedSkills,
  setError,
  intent,
  setIntent,
  setSelectedSkills,
  t,
}: Props & { t: (source: string) => string }) {
  return (
    <>
      <AnalysisComposerStepHeader
        id="analysis-skills-heading"
        step="2"
        title={t("Escolha as skills")}
        description={t("Selecione as lentes oficiais que devem orientar a análise.")}
      />
      <AnalysisComposerSkills
        catalog={catalog}
        catalogError={catalogError}
        isCatalogLoading={isCatalogLoading}
        isPending={isPending}
        selectedSkills={selectedSkills}
        setError={setError}
        setSelectedSkills={setSelectedSkills}
      />
      <AnalysisComposerIntent
        intent={intent}
        isPending={isPending}
        setError={setError}
        setIntent={setIntent}
      />
    </>
  );
}

function ReviewStep({ assets, catalog, file, intent, mode, selectedSkills, selectedSourceAssetId, url }: Props) {
  return (
    <AnalysisComposerReview
      assets={assets}
      catalog={catalog}
      file={file}
      intent={intent}
      mode={mode}
      selectedSkills={selectedSkills}
      selectedSourceAssetId={selectedSourceAssetId}
      url={url}
    />
  );
}
