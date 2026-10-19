import { translate } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";
import type { ComposerMode, ComposerStep } from "../types/analysis-composer.types";

export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".webm"];

export function validateFile(selectedFile: File, locale: Locale = "pt-br") {
  const extension = `.${selectedFile.name.split(".").pop()?.toLowerCase() ?? ""}`;

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return translate(locale, "Selecione um arquivo MP4, MOV ou WEBM.");
  }

  if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
    return translate(locale, "O arquivo deve ter no máximo 200 MB.");
  }

  return null;
}

export function hasReadySource(mode: ComposerMode, url: string, file: File | null, selectedSourceAssetId: string | null) {
  if (mode === "file") {
    return Boolean(file);
  }

  if (mode === "asset") {
    return Boolean(selectedSourceAssetId);
  }

  return url.trim().length > 0;
}

export function getSourceAction(mode: ComposerMode, locale: Locale = "pt-br") {
  if (mode === "file") {
    return translate(locale, "selecionar um arquivo de vídeo");
  }

  if (mode === "asset") {
    return translate(locale, "selecionar um vídeo salvo");
  }

  return translate(locale, "informar uma URL pública");
}

export function getMissingInputMessage(mode: ComposerMode, hasSource: boolean, selectedSkillsCount: number, locale: Locale = "pt-br") {
  const missing: string[] = [];

  if (!hasSource) {
    missing.push(getSourceAction(mode, locale));
  }

  if (selectedSkillsCount === 0) {
    missing.push(translate(locale, "selecionar pelo menos uma skill publicada"));
  }

  return missing.length > 0 ? translate(locale, "Antes de iniciar, {missing}.", { missing: missing.join(` ${translate(locale, "e")} `) }) : null;
}

export function getStepMissingMessage(step: ComposerStep, mode: ComposerMode, hasSource: boolean, selectedSkillsCount: number, locale: Locale = "pt-br") {
  if (step === "source" && !hasSource) {
    return translate(locale, "Antes de avançar, {missing}.", { missing: getSourceAction(mode, locale) });
  }

  if (step === "skills" && selectedSkillsCount === 0) {
    return translate(locale, "Antes de avançar, selecione pelo menos uma skill publicada.");
  }

  return null;
}
