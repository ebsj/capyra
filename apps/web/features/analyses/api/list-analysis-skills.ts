import { createBrowserApiRequest } from "@/lib/http";
import type { AnalysisSkillCatalogResponseContract } from "@/lib/models";

export function listAnalysisSkills(accessToken: string): Promise<AnalysisSkillCatalogResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<AnalysisSkillCatalogResponseContract>("/analysis-skills");
}
