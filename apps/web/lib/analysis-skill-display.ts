import type { AnalysisSkillCatalogItem } from "@/lib/models";

type Translate = (source: string, values?: Record<string, string | number>) => string;

function normalizeCatalogText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getSkillDisplayName(item: AnalysisSkillCatalogItem, t: Translate) {
  const normalized = normalizeCatalogText(item.name);
  const labels: Record<string, string> = {
    "audio e musica": "Áudio e música",
    compliance: "Conformidade",
    "conteudo e estrategia": "Conteúdo e estratégia",
    edicao: "Edição",
    filmagem: "Filmagem",
  };

  return t(labels[normalized] ?? item.name);
}

export function getSkillDisplaySummary(item: AnalysisSkillCatalogItem, t: Translate) {
  const normalized = normalizeCatalogText(item.name);
  const summaries: Record<string, string> = {
    "audio e musica": "Qualidade da voz e escolha musical.",
    compliance: "Riscos observáveis de direitos autorais e conformidade.",
    "conteudo e estrategia": "Roteiro, promessa e sinais observáveis de engajamento.",
    edicao: "Edição, dinamismo e sobreposições de texto.",
    filmagem: "Qualidade de captura, enquadramento e linguagem visual.",
  };

  return t(summaries[normalized] ?? item.coverageSummary);
}
