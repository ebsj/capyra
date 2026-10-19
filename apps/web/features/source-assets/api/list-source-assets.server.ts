import { createServerApiRequest } from "@/lib/http.server";
import type { SourceAssetListResponseContract } from "@/lib/models";

export function listSourceAssetsForServer(accessToken: string): Promise<SourceAssetListResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<SourceAssetListResponseContract>("/source-assets");
}
