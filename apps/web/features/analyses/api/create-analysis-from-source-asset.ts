import { createBrowserApiRequest } from "@/lib/http";
import type {
  AnalysisDetailResponseContract,
  CreateAnalysisFromSourceAssetRequestContract,
} from "@/lib/models";

export function createAnalysisFromSourceAsset(
  accessToken: string,
  body: CreateAnalysisFromSourceAssetRequestContract,
): Promise<AnalysisDetailResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<AnalysisDetailResponseContract>("/analyses", { method: "POST", body });
}
