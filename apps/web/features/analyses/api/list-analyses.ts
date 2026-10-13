import { createServerApiRequest } from "@/lib/http.server";
import type { AnalysisListResponseContract } from "@/lib/models";

export function listAnalyses(accessToken: string): Promise<AnalysisListResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<AnalysisListResponseContract>("/analyses");
}
