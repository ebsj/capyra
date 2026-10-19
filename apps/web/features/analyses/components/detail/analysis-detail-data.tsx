import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisDetailResponseContract, AnalysisSkillId } from "@/lib/models";

import { DetailGroup, EmptyInlineState } from "./analysis-detail-shared";
import {
  buildEvidenceHighlights,
  buildInterpretationNotes,
  buildWarningNotes,
  formatAnalysisSource,
  formatDateTime,
  formatScore,
  formatSeconds,
  getAnalysisSkillBadgeVariant,
  getAnalysisSkillLabel,
  getAnalysisStatusLabel,
} from "../../utils/analysis-utils";

function MetadataGrid({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <div className="grid divide-y divide-border/70 md:grid-cols-2 md:divide-y-0">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 p-4 first:pt-0 md:border-border/70 md:first:pt-4 md:odd:pl-0 md:even:border-l md:even:pr-0"
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-2 min-w-0 break-words text-sm font-medium leading-6 text-foreground [overflow-wrap:anywhere]">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBoolean(value: boolean | null | undefined) {
  // This function is only used through DataPanel, which localizes its return value.
  if (typeof value !== "boolean") {
    return "n/a";
  }

  return value ? "Sim" : "Não";
}

export function DataPanel({
  analysis,
  selectedSkillIds,
  executedSkillsCount,
  warningNotes,
  interpretationNotes,
  evidenceHighlights,
}: {
  analysis: AnalysisDetailResponseContract;
  selectedSkillIds: AnalysisSkillId[];
  executedSkillsCount: number;
  warningNotes: ReturnType<typeof buildWarningNotes>;
  interpretationNotes: ReturnType<typeof buildInterpretationNotes>;
  evidenceHighlights: ReturnType<typeof buildEvidenceHighlights>;
}) {
  const { locale, t } = useI18n();
  const report = analysis.report;
  const source = report?.source;
  const transcript = report?.transcript;

  return (
    <section className="min-w-0 rounded-[1.75rem] border border-border bg-card px-3 shadow-sm sm:px-5">
      <DetailGroup title={t("Origem")} defaultOpen>
        <MetadataGrid
          items={[
            {
              label: t("Origem"),
              value: formatAnalysisSource(source?.sourceLabel ?? analysis.sourceLabel, source?.sourceUrl ?? analysis.sourceUrl),
            },
            { label: t("Objetivo informado"), value: analysis.intent ?? t("Sem objetivo informado") },
            { label: t("URL canônica"), value: source?.canonicalUrl ?? analysis.canonicalUrl ?? t("n/a") },
            { label: t("Plataforma"), value: source?.platform ?? analysis.platform ?? t("n/a") },
            { label: "Content ID", value: source?.contentId ?? analysis.contentId ?? "n/a" },
            { label: t("Duração"), value: formatSeconds(source?.durationSeconds ?? null, locale) },
            { label: t("Dimensões"), value: source ? `${source.width}x${source.height}` : t("n/a") },
            { label: "FPS", value: source?.fps ?? t("n/a") },
            { label: t("Áudio"), value: t(formatBoolean(source?.hasAudio)) },
          ]}
        />
      </DetailGroup>

      <DetailGroup title={t("Execução")} defaultOpen>
        <MetadataGrid
          items={[
            { label: "ID", value: analysis.id },
            { label: t("Status"), value: getAnalysisStatusLabel(analysis.status, locale) },
            { label: t("Criada em"), value: formatDateTime(analysis.createdAt, locale) },
            { label: t("Concluída em"), value: formatDateTime(analysis.completedAt, locale) },
            { label: t("Catálogo"), value: report?.catalogVersion ?? analysis.catalogVersion },
            { label: t("Skills selecionadas"), value: selectedSkillIds.length },
            { label: t("Skills executadas"), value: executedSkillsCount },
            { label: t("Nota geral"), value: formatScore(analysis.overallScore ?? report?.overallScore, locale) },
          ]}
        />
      </DetailGroup>

      <DetailGroup title={t("Skills selecionadas")} count={selectedSkillIds.length}>
        <div className="flex flex-wrap gap-2">
          {selectedSkillIds.length > 0 ? (
            selectedSkillIds.map((skillId) => (
              <Badge key={skillId} variant={getAnalysisSkillBadgeVariant(skillId)}>
                {getAnalysisSkillLabel(skillId, locale)}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">{t("Sem skills selecionadas")}</Badge>
          )}
        </div>
      </DetailGroup>

      <DetailGroup title={t("Transcrição")}>
        {transcript ? (
          <div className="grid gap-4">
            <div className="border-b border-border/70 pb-4">
              <p className="text-sm leading-7 text-foreground">{transcript.text}</p>
            </div>
            {transcript.segments.length > 0 ? (
              <div className="divide-y divide-border/70">
                {transcript.segments.map((segment) => (
                  <div
                    key={`${segment.startSeconds}-${segment.endSeconds}-${segment.text}`}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <Badge variant="info">
                      {formatSeconds(segment.startSeconds, locale)} - {formatSeconds(segment.endSeconds, locale)}
                    </Badge>
                    <p className="mt-3 text-sm leading-7 text-foreground">{segment.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyInlineState title={t("Transcrição indisponível.")} />
        )}
      </DetailGroup>

      <DetailGroup title={t("Evidências em destaque")} count={evidenceHighlights.length}>
        {evidenceHighlights.length > 0 ? (
          <div className="divide-y divide-border/70">
            {evidenceHighlights.map((highlight) => (
              <div key={highlight.key} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={getAnalysisSkillBadgeVariant(highlight.skillId)}>{highlight.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatSeconds(highlight.timestampSeconds, locale)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-foreground">{highlight.observation}</p>
                {highlight.transcriptQuote ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{highlight.transcriptQuote}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyInlineState title={t("Nenhuma evidência estruturada.")} />
        )}
      </DetailGroup>

      <DetailGroup title={t("Avisos e limites")} count={warningNotes.length + interpretationNotes.length}>
        <div className="divide-y divide-border/70">
          {warningNotes.map((warning) => (
            <div key={`${warning.skillId}-${warning.message}`} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">{warning.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{warning.message}</p>
            </div>
          ))}
          {interpretationNotes.map((note) => (
            <div key={note.skillId} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-foreground">{note.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.disclaimer}</p>
            </div>
          ))}
          {warningNotes.length === 0 && interpretationNotes.length === 0 ? (
            <EmptyInlineState title={t("Nenhum aviso ou limite adicional.")} />
          ) : null}
        </div>
      </DetailGroup>

      <DetailGroup title={t("Artefatos técnicos")}>
        <MetadataGrid
          items={[
            { label: "Blob prefix", value: analysis.artifacts.blobPathPrefix ?? "n/a" },
            { label: t("Arquivos"), value: analysis.artifacts.files.length },
            { label: t("Diretório"), value: source?.artifactDirectory ?? t("n/a") },
            { label: "Ingest", value: source?.ingestStatus ?? "n/a" },
          ]}
        />
      </DetailGroup>
    </section>
  );
}
