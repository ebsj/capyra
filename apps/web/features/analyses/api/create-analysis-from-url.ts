import { createBrowserApiRequest } from "@/lib/http";
import type {
  AnalysisDetailResponseContract,
  CreateAnalysisFromUrlRequestContract,
} from "@/lib/models";

export function createAnalysisFromUrl(
  accessToken: string,
  body: CreateAnalysisFromUrlRequestContract,
): Promise<AnalysisDetailResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<AnalysisDetailResponseContract>("/analyses", { method: "POST", body });
}
