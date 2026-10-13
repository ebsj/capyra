import { createBrowserApiRequest } from "@/lib/http";
import type {
  AnalysisDetailResponseContract,
  AnalysisSkillId,
  CreateAnalysisFileRequest,
} from "@/lib/models";

function buildCreateAnalysisFileFormData(file: File, brandId: string, language: string | null | undefined, skills: AnalysisSkillId[], intent?: string | null) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("brandId", brandId);
  if (language) {
    formData.append("language", language);
  }
  if (intent) {
    formData.append("intent", intent);
  }
  for (const skill of skills) {
    formData.append("skills", skill);
  }
  return formData;
}

export function createAnalysisWithSelectedSkillsFromFile(
  accessToken: string,
  { file, brandId, language = "pt-BR", skills, intent }: CreateAnalysisFileRequest,
): Promise<AnalysisDetailResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  const body = buildCreateAnalysisFileFormData(file, brandId, language, skills, intent?.trim() || null);
  return request<AnalysisDetailResponseContract>("/analyses", { method: "POST", body });
}

export function createAnalysisFromFile(
  accessToken: string,
  file: File,
  brandId: string,
  language = "pt-BR",
  skills: AnalysisSkillId[] = [],
  intent?: string | null,
): Promise<AnalysisDetailResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  const body = buildCreateAnalysisFileFormData(file, brandId, language, skills, intent?.trim() || null);
  return request<AnalysisDetailResponseContract>("/analyses", { method: "POST", body });
}
