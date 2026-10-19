import type { AnalysisSkillCatalogItemContract, AnalysisSkillId } from "@capyra/contracts";

export const CATALOG_VERSION = "2026-07-02-hide-compliance";
export const PUBLISHED_SKILLS = ["content_strategy", "filming", "editing", "audio_music"] as const;

const descriptions: Record<(typeof PUBLISHED_SKILLS)[number], Omit<AnalysisSkillCatalogItemContract, "id" | "slug" | "status">> = {
  content_strategy: {
    name: "conteudo e estrategia",
    description: "Avalia script, promessa, clareza e potencial de engajamento observavel.",
    coverageSummary: "Script, promessa e sinais observaveis de engajamento.",
    criteria: ["script_quality", "observable_engagement_potential"],
    safeLanguageNotes: ["Engajamento e apenas estimativa observavel no video, nunca metrica real de plataforma."],
  },
  filming: {
    name: "filmagem",
    description: "Avalia enquadramento, captacao e linguagem cinematografica da gravacao.",
    coverageSummary: "Qualidade de captura, enquadramento e linguagem cinematografica.",
    criteria: ["filming_quality", "cinematographic_language", "videography"],
    safeLanguageNotes: [],
  },
  editing: {
    name: "edicao",
    description: "Avalia ritmo, cortes, dinamismo e uso de textos na tela.",
    coverageSummary: "Edicao, dinamismo e overlays de texto.",
    criteria: ["editing", "dynamism", "text_overlay"],
    safeLanguageNotes: [],
  },
  audio_music: {
    name: "audio e musica",
    description: "Avalia clareza da voz, musica e equilibrio do audio percebido.",
    coverageSummary: "Qualidade da voz e escolha musical.",
    criteria: ["voice_quality", "music_choice"],
    safeLanguageNotes: [],
  },
};

export function catalogResponse() {
  const items = PUBLISHED_SKILLS.map((id) => ({ id, slug: id, status: "published" as const, ...descriptions[id] }));
  return { version: CATALOG_VERSION, publishedAt: "2026-07-02T00:00:00.000Z", items };
}

export function validateSkills(skills: unknown): AnalysisSkillId[] {
  if (!Array.isArray(skills) || skills.length === 0) throw new Error("At least one skill is required.");
  const unique = [...new Set(skills)];
  if (unique.some((skill) => typeof skill !== "string" || !(PUBLISHED_SKILLS as readonly string[]).includes(skill))) {
    throw new Error("One or more skills are invalid or unpublished.");
  }
  return unique as AnalysisSkillId[];
}
