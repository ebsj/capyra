import type { AnalysisArtifactItemContract } from "@/lib/models";

export function buildArtifactSections(items: AnalysisArtifactItemContract[]) {
  const order = ["video", "frame", "audio", "report", "manifest", "other"] as const;
  const groups = new Map<string, AnalysisArtifactItemContract[]>();

  for (const item of items) {
    const key = order.some((category) => category === item.category) ? item.category : "other";
    const current = groups.get(key) ?? [];
    current.push(item);
    groups.set(key, current);
  }

  return order
    .map((category) => ({
      category,
      items: groups.get(category) ?? [],
    }))
    .filter((section) => section.items.length > 0);
}

export function getArtifactSectionTitle(category: string) {
  switch (category) {
    case "video":
      return "Vídeo";
    case "frame":
      return "Frames";
    case "audio":
      return "Áudio";
    case "report":
      return "Relatórios";
    case "manifest":
      return "Manifestos";
    default:
      return "Outros";
  }
}

export function isFrameArtifact(item: AnalysisArtifactItemContract) {
  return item.category === "frame";
}

export interface ArtifactPreviewMetadata {
  displayMode: "thumbnail" | "standard";
  sectionTitle: string;
  title: string;
  description: string;
  actionLabel: string;
}

export function buildArtifactPreviewMetadata(item: AnalysisArtifactItemContract): ArtifactPreviewMetadata {
  const displayMode = isFrameArtifact(item) ? "thumbnail" : "standard";
  const sectionTitle = getArtifactSectionTitle(item.category);

  return {
    displayMode,
    sectionTitle,
    title: item.fileName,
    description: displayMode === "thumbnail" ? "Frame" : sectionTitle,
    actionLabel: displayMode === "thumbnail" ? "Ampliar frame" : "Abrir artefato",
  };
}
