import { createBrowserApiRequest } from "@/lib/http";
import type {
  SourceAssetDirectUploadCompleteRequestContract,
  SourceAssetItemContract,
} from "@/lib/models";

export function completeSourceAssetDirectUpload(
  accessToken: string,
  sourceAssetId: string,
  body: SourceAssetDirectUploadCompleteRequestContract,
): Promise<SourceAssetItemContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetItemContract>(`/source-assets/direct-uploads/${sourceAssetId}/complete`, {
    method: "POST",
    body,
  });
}
