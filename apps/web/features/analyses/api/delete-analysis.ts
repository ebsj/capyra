import { createBrowserApiRequest } from "@/lib/http";

export function deleteAnalysis(analysisId: string, accessToken?: string | null): Promise<void> {
  const request = createBrowserApiRequest(accessToken);
  return request<void>(`/analyses/${analysisId}`, { method: "DELETE" });
}
