import { createServerApiRequest } from "@/lib/http.server";
import type { AnalysisSkillCatalogResponseContract } from "@/lib/models";

export function listAnalysisSkillsForServer(accessToken: string): Promise<AnalysisSkillCatalogResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<AnalysisSkillCatalogResponseContract>("/analysis-skills");
}
