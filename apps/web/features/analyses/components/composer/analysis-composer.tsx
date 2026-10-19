"use client";

import type { DragEvent, FormEvent } from "react";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { BrandSelect } from "@/features/brands";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getAnalysisLanguage } from "@/lib/analysis-language";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics-client";
import type { AnalysisDetailResponseContract, AnalysisSkillCatalogItem, SelectedAnalysisSkillId, SourceAssetItem } from "@/lib/models";
import { ApiError } from "@/lib/http";
import { createAnalysisFromSourceAsset } from "../../api/create-analysis-from-source-asset";
import { createAnalysisFromUrl } from "../../api/create-analysis-from-url";
import { listAnalysisSkills } from "../../api/list-analysis-skills";
import {
  createSourceAsset,
  listSourceAssets,
} from "@/features/source-assets/api/source-assets-browser-api";

import {
  getMissingInputMessage,
  getStepMissingMessage,
  hasReadySource,
  validateFile,
} from "../../utils/analysis-composer-flow";
import type { ComposerMode, ComposerStep } from "../../types/analysis-composer.types";
import { AnalysisComposerHeader } from "./analysis-composer-header";
import { MAX_INTENT_LENGTH } from "./analysis-composer-intent";
import { AnalysisComposerNavigation } from "./analysis-composer-navigation";
import { AnalysisComposerStepContent } from "./analysis-composer-step-content";
import { AnalysisComposerWizard } from "./analysis-composer-wizard";

type Props = {
  accessToken: string;
  initialAssets?: SourceAssetItem[];
  initialCatalog?: AnalysisSkillCatalogItem[];
  onCreated: (analysis: AnalysisDetailResponseContract) => void;
};

function getFieldErrorMessage(error: unknown, field: string) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  return error.fieldErrors.find((item) => item.field === field)?.message ?? null;
}

function normalizeIntent(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getIntentValidationMessage(value: string, t: (source: string) => string) {
  return (normalizeIntent(value)?.length ?? 0) > MAX_INTENT_LENGTH
    ? t("O objetivo do vídeo deve ter no máximo 1000 caracteres.")
    : null;
}

export function AnalysisComposer({ accessToken, initialAssets = [], initialCatalog = [], onCreated }: Props) {
  const { locale, t } = useI18n();
  const analysisLanguage = getAnalysisLanguage(locale);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandId, setBrandId] = useState("");
  const [step, setStep] = useState<ComposerStep>("source");
  const [mode, setMode] = useState<ComposerMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [intent, setIntent] = useState("");
  const [assets, setAssets] = useState<SourceAssetItem[]>(initialAssets);
  const [selectedSourceAssetId, setSelectedSourceAssetId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<AnalysisSkillCatalogItem[]>(initialCatalog);
  const [selectedSkills, setSelectedSkills] = useState<SelectedAnalysisSkillId[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasSource = hasReadySource(mode, url, file, selectedSourceAssetId);
  const selectedSkillsCount = selectedSkills.length;

  useEffect(() => {
    let cancelled = false;

    setIsCatalogLoading(initialCatalog.length === 0);
    setIsAssetsLoading(initialAssets.length === 0);
    setCatalogError(null);
    setAssetsError(null);

    void listAnalysisSkills(accessToken)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const published = response.items.filter((item) => item.status === "published");
        setCatalog(published);
        setSelectedSkills((current) => current.filter((skillId) => published.some((item) => item.id === skillId)));
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setCatalog([]);
        setSelectedSkills([]);
        setCatalogError(err instanceof Error ? err.message : t("Falha ao carregar o catálogo de skills."));
      })
      .finally(() => {
        if (!cancelled) {
          setIsCatalogLoading(false);
        }
      });

    void listSourceAssets(accessToken)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setAssets(response.items);
        setSelectedSourceAssetId((current) => (current && response.items.some((item) => item.id === current) ? current : null));
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setAssets([]);
        setSelectedSourceAssetId(null);
        setAssetsError(err instanceof Error ? err.message : t("Falha ao carregar os arquivos salvos."));
      })
      .finally(() => {
        if (!cancelled) {
          setIsAssetsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, initialAssets.length, initialCatalog.length]);

  const selectFile = (selectedFile: File | null) => {
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validationError = validateFile(selectedFile, locale);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setMode("file");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);

    if (isPending) {
      return;
    }

    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  const goToNextStep = () => {
    setError(null);

    const missingMessage = getStepMissingMessage(step, mode, hasSource, selectedSkillsCount, locale);
    if (missingMessage) {
      setError(missingMessage);
      return;
    }

    const intentValidationMessage = step === "skills" ? getIntentValidationMessage(intent, t) : null;
    if (intentValidationMessage) {
      setError(intentValidationMessage);
      return;
    }

    setStep(step === "source" ? "skills" : "review");
  };

  const goToPreviousStep = () => {
    setError(null);
    setStep(step === "review" ? "skills" : "source");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!brandId) { setError(t("Selecione uma Marca")); return; }

    if (step !== "review") {
      goToNextStep();
      return;
    }

    const missingMessage = getMissingInputMessage(mode, hasSource, selectedSkills.length, locale);
    if (missingMessage) {
      setError(missingMessage);
      return;
    }

    const intentValidationMessage = getIntentValidationMessage(intent, t);
    if (intentValidationMessage) {
      setError(intentValidationMessage);
      return;
    }

    startTransition(async () => {
      try {
        let created: AnalysisDetailResponseContract;
        const normalizedIntent = normalizeIntent(intent);

        if (mode === "file") {
          const createdAsset = await createSourceAsset(accessToken, file as File, brandId);
          setAssets((current) => [createdAsset, ...current.filter((asset) => asset.id !== createdAsset.id)]);
          created = await createAnalysisFromSourceAsset(accessToken, {
            brandId,
            sourceAssetId: createdAsset.id,
            language: analysisLanguage,
            skills: selectedSkills,
            intent: normalizedIntent,
          });
        } else if (mode === "asset") {
          created = await createAnalysisFromSourceAsset(accessToken, {
            brandId,
            sourceAssetId: selectedSourceAssetId as string,
            language: analysisLanguage,
            skills: selectedSkills,
            intent: normalizedIntent,
          });
        } else {
          created = await createAnalysisFromUrl(accessToken, {
            brandId,
            url: url.trim(),
            language: analysisLanguage,
            skills: selectedSkills,
            intent: normalizedIntent,
          });
        }

        setUrl("");
        setFile(null);
        setIntent("");
        setSelectedSourceAssetId(null);
        setSelectedSkills([]);
        setStep("source");
        trackGoogleAnalyticsEvent("analysis_created", {
          analysis_language: analysisLanguage,
          skills_count: selectedSkills.length,
          source_type: mode,
        });
        onCreated(created);
      } catch (err) {
        setError(
          getFieldErrorMessage(err, "intent") ??
            getFieldErrorMessage(err, "skills") ??
            getFieldErrorMessage(err, "url") ??
            (err instanceof Error ? err.message : t("Não foi possível iniciar a análise.")),
        );
      }
    });
  };

  return (
    <Card className="min-w-0 overflow-hidden rounded-[2rem] border-border bg-card/94 shadow-xl shadow-foreground/5">
      <AnalysisComposerHeader />

      <CardContent className="p-5 sm:p-6">
        <form className="grid min-w-0 gap-5" noValidate onSubmit={handleSubmit}>
          <BrandSelect accessToken={accessToken} value={brandId} onChange={(id) => { setBrandId(id); setSelectedSourceAssetId(null); }} />
          <p className="text-sm text-muted-foreground">{t("Uma análise reserva um crédito. Apenas vídeos de até três minutos podem ser analisados.")}</p>
          <AnalysisComposerWizard currentStep={step} />

          <AnalysisComposerStepContent
            assets={assets.filter((asset) => asset.brandId === brandId && asset.mediaKind !== "image")}
            assetsError={assetsError}
            catalog={catalog}
            catalogError={catalogError}
            file={file}
            fileInputId={fileInputId}
            fileInputRef={fileInputRef}
            isAssetsLoading={isAssetsLoading}
            isCatalogLoading={isCatalogLoading}
            isDraggingFile={isDraggingFile}
            isPending={isPending}
            intent={intent}
            mode={mode}
            selectedSkills={selectedSkills}
            selectedSourceAssetId={selectedSourceAssetId}
            setError={setError}
            setFile={setFile}
            setIsDraggingFile={setIsDraggingFile}
            setIntent={setIntent}
            setMode={setMode}
            setSelectedSkills={setSelectedSkills}
            setSelectedSourceAssetId={setSelectedSourceAssetId}
            setUrl={setUrl}
            step={step}
            url={url}
            onDrop={handleDrop}
            onSelectFile={selectFile}
          />

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{step === "review" ? t("Não foi possível iniciar") : t("Ainda falta uma etapa")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <AnalysisComposerNavigation
            catalogCount={catalog.length}
            currentStep={step}
            isCatalogLoading={isCatalogLoading}
            isPending={isPending}
            onBack={goToPreviousStep}
          />
        </form>
      </CardContent>
    </Card>
  );
}
