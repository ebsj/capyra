import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

export function formatPriority(value: string | null | undefined, locale: Locale = "pt-br") {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "high") {
    return translate(locale, "Alta");
  }

  if (normalized === "medium") {
    return translate(locale, "Média");
  }

  if (normalized === "low") {
    return translate(locale, "Baixa");
  }

  return translate(locale, "Indefinida");
}

export function formatEvidenceKind(value: string | null | undefined, locale: Locale = "pt-br") {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return translate(locale, "Evidência");
  }

  const labels: Record<string, string> = {
    frame: "Frame",
    visual: "Visual",
    audio: translate(locale, "Áudio"),
    transcript: translate(locale, "Transcrição"),
    source: translate(locale, "Fonte"),
    timing: translate(locale, "Tempo"),
    metric: translate(locale, "Métrica"),
    observation: translate(locale, "Observação"),
  };

  return labels[normalized] ?? normalized.replaceAll("_", " ").replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}
