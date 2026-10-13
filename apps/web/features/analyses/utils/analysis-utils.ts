import type {
  AnalysisDetailResponseContract,
  AnalysisListItemContract,
  AnalysisSkillId,
  ExecutedAnalysisSkillContract,
  ExecutedAnalysisSkillStatus,
  ShortVideoAnalysisReportContract,
  VideoAnalysisStatus,
} from "@/lib/models";
import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";

const ANALYSIS_SKILL_LABELS: Record<AnalysisSkillId, string> = {
  content_strategy: "Conteúdo e estratégia",
  filming: "Filmagem",
  editing: "Edição",
  audio_music: "Áudio e música",
  compliance: "Compliance",
};

type AnalysisBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brandSoft"
  | "sage"
  | "sand"
  | "navy";

const EXECUTED_SKILL_STATUS_LABELS: Record<ExecutedAnalysisSkillStatus, string> = {
  completed: "Concluída",
  insufficient_evidence: "Evidência insuficiente",
  failed: "Falhou",
};

const ANALYSIS_STATUS_LABELS: Record<VideoAnalysisStatus, string> = {
  completed: "Concluída",
  pending: "Em processamento",
  failed: "Falhou",
};

const EXECUTED_SKILL_STATUS_VARIANTS: Record<ExecutedAnalysisSkillStatus, AnalysisBadgeVariant> = {
  completed: "success",
  insufficient_evidence: "warning",
  failed: "danger",
};

const ANALYSIS_STATUS_VARIANTS: Record<VideoAnalysisStatus, AnalysisBadgeVariant> = {
  completed: "success",
  pending: "sand",
  failed: "danger",
};

const ANALYSIS_SKILL_BADGE_VARIANTS: Record<AnalysisSkillId, AnalysisBadgeVariant> = {
  content_strategy: "brandSoft",
  filming: "sage",
  editing: "sand",
  audio_music: "navy",
  compliance: "warning",
};
const displayTimeZone = "America/Sao_Paulo";

export interface ExecutedSkillSection extends ExecutedAnalysisSkillContract {
  label: string;
}

function ensureArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function toIntlLocale(locale: Locale = "pt-br") {
  return locale === "pt-br" ? "pt-BR" : locale;
}

function formatDateKey(value: Date, locale: Locale) {
  return value.toLocaleDateString(toIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    timeZone: displayTimeZone,
    year: "numeric",
  });
}

export function formatScore(value: number | null | undefined, locale: Locale = "pt-br") {
  return typeof value === "number" ? value.toFixed(1) : translate(locale, "n/a");
}

export function formatAnalysisSource(sourceLabel: string, sourceUrl?: string | null) {
  return sourceUrl?.trim() || sourceLabel;
}

export function formatDateTime(value: string | null | undefined, locale: Locale = "pt-br") {
  if (!value) {
    return translate(locale, "n/a");
  }

  return new Date(value).toLocaleString(toIntlLocale(locale), {
    dateStyle: "medium",
    timeZone: displayTimeZone,
    timeStyle: "short",
  });
}

export function formatRelativeDate(value: string | null | undefined, locale: Locale = "pt-br") {
  if (!value) {
    return translate(locale, "data indisponível");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return translate(locale, "data indisponível");
  }

  const now = new Date();
  const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
  const intlLocale = toIntlLocale(locale);
  const formatter = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });

  if (Math.abs(diffHours) < 24) {
    const time = date.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit", timeZone: displayTimeZone });
    return `${formatDateKey(date, locale) === formatDateKey(now, locale) ? translate(locale, "Hoje") : translate(locale, "Ontem")}, ${time}`;
  }

  return formatter.format(Math.round(diffHours / 24), "day");
}

export function formatSeconds(value: number | null | undefined, locale: Locale = "pt-br") {
  if (typeof value !== "number") {
    return translate(locale, "n/a");
  }

  return `${value.toFixed(1)}s`;
}

export function getAnalysisSkillLabel(skillId: AnalysisSkillId, locale: Locale = "pt-br") {
  return translate(locale, ANALYSIS_SKILL_LABELS[skillId] ?? skillId);
}

export function getAnalysisSkillBadgeVariant(skillId: AnalysisSkillId) {
  return ANALYSIS_SKILL_BADGE_VARIANTS[skillId] ?? "outline";
}

export function getAnalysisStatusLabel(status: VideoAnalysisStatus, locale: Locale = "pt-br") {
  return translate(locale, ANALYSIS_STATUS_LABELS[status]);
}

export function getAnalysisStatusVariant(status: VideoAnalysisStatus) {
  return ANALYSIS_STATUS_VARIANTS[status];
}

export function getExecutedSkillStatusLabel(status: ExecutedAnalysisSkillStatus, locale: Locale = "pt-br") {
  return translate(locale, EXECUTED_SKILL_STATUS_LABELS[status]);
}

export function getExecutedSkillStatusVariant(status: ExecutedAnalysisSkillStatus) {
  return EXECUTED_SKILL_STATUS_VARIANTS[status];
}

export function buildExecutedSkillSections(
  report: ShortVideoAnalysisReportContract | null,
  locale: Locale = "pt-br",
): ExecutedSkillSection[] {
  if (!report) {
    return [];
  }

  const executedSkills = ensureArray(report.executedSkills);
  const selectedSkillIds = ensureArray(report.selectedSkillIds);
  const executedBySkill = new Map(executedSkills.map((skill) => [skill.skillId, skill]));
  const orderedSkillIds = selectedSkillIds.length > 0 ? selectedSkillIds : executedSkills.map((skill) => skill.skillId);

  return orderedSkillIds.map((skillId) => {
    const section = executedBySkill.get(skillId);

    if (!section) {
      return {
        label: getAnalysisSkillLabel(skillId, locale),
        skillId,
        status: "insufficient_evidence" as const,
        evaluatedItems: [],
        summary: "Seção indisponível para esta skill selecionada.",
        skillScore: 0,
        propertyScores: [],
        detailedAssessment: "O payload final não retornou esta skill selecionada.",
        strengths: [],
        improvementOpportunities: ["Reexecutar a análise com essa skill selecionada."],
        recommendations: [],
        keySignals: [],
        evidence: [],
        evidenceGaps: ["O resultado final não retornou esta skill selecionada."],
        transcriptExcerpts: [],
        warnings: ["Seção ausente no payload da IA."],
        disclaimer: null,
      };
    }

    return {
      ...section,
      evaluatedItems: ensureArray(section.evaluatedItems),
      propertyScores: ensureArray(section.propertyScores),
      strengths: ensureArray(section.strengths),
      improvementOpportunities: ensureArray(section.improvementOpportunities),
      recommendations: ensureArray(section.recommendations),
      keySignals: ensureArray(section.keySignals),
      evidence: ensureArray(section.evidence),
      evidenceGaps: ensureArray(section.evidenceGaps),
      transcriptExcerpts: ensureArray(section.transcriptExcerpts),
      warnings: ensureArray(section.warnings),
      summary: section.summary ?? "",
      detailedAssessment: section.detailedAssessment ?? "",
      disclaimer: section.disclaimer ?? null,
      label: getAnalysisSkillLabel(skillId, locale),
    };
  });
}

export function buildStatusBreakdown(items: AnalysisListItemContract[]) {
  return [
    {
      name: "Concluídas",
      value: items.filter((item) => item.status === "completed").length,
      status: "completed" as const,
    },
    {
      name: "Pendentes",
      value: items.filter((item) => item.status === "pending").length,
      status: "pending" as const,
    },
    {
      name: "Observações",
      value: items.filter((item) => item.status === "failed").length,
      status: "failed" as const,
    },
  ];
}

export function buildRecentScoreSeries(items: AnalysisListItemContract[], limit = 6) {
  return [...items]
    .slice(0, limit)
    .reverse()
    .map((item) => ({
      id: item.id,
      label: new Date(item.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        timeZone: displayTimeZone,
      }),
      score: item.overallScore ?? 0,
      status: item.status,
    }));
}

export function buildActionRequiredItems(items: AnalysisListItemContract[]) {
  return items
    .filter((item) => item.status !== "completed")
    .sort((left, right) => {
      if (left.status === right.status) {
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }

      return left.status === "failed" ? -1 : 1;
    });
}

export function buildInterpretationNotes(executedSkills: ExecutedAnalysisSkillContract[]) {
  return ensureArray(executedSkills).flatMap((skill) =>
    skill.disclaimer
      ? [
          {
            skillId: skill.skillId,
            label: getAnalysisSkillLabel(skill.skillId),
            disclaimer: skill.disclaimer,
          },
        ]
      : [],
  );
}

export function buildWarningNotes(analysis: AnalysisDetailResponseContract) {
  const sectionWarnings = ensureArray(analysis.executedSkills).flatMap((skill) =>
    ensureArray(skill.warnings).map((warning) => ({
      skillId: skill.skillId,
      label: getAnalysisSkillLabel(skill.skillId),
      message: warning,
    })),
  );

  const reportWarnings = ensureArray(analysis.report?.warnings).map((warning) => ({
    skillId: "report",
    label: "Relatório",
    message: warning,
  }));

  return [...reportWarnings, ...sectionWarnings];
}

export function buildEvidenceHighlights(sections: ExecutedSkillSection[]) {
  return sections.flatMap((section) =>
    ensureArray(section.evidence).slice(0, 2).map((item) => ({
      key: `${section.skillId}-${item.timestampSeconds}-${item.kind}`,
      skillId: section.skillId,
      label: section.label,
      kind: item.kind,
      observation: item.observation,
      transcriptQuote: item.transcriptQuote,
      timestampSeconds: item.timestampSeconds,
    })),
  );
}
