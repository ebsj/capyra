import { createBrowserApiRequest } from "@/lib/http";
import type { SourceAssetListResponseContract } from "@/lib/models";

export function listSourceAssets(accessToken: string): Promise<SourceAssetListResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetListResponseContract>("/source-assets");
}
