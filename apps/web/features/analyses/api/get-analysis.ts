import { createServerApiRequest } from "@/lib/http.server";
import type { AnalysisDetailResponseContract } from "@/lib/models";

export function getAnalysis(accessToken: string, analysisId: string): Promise<AnalysisDetailResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<AnalysisDetailResponseContract>(`/analyses/${analysisId}`);
}
