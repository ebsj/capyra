import { createBrowserApiRequest } from "@/lib/http";
import type {
  SourceAssetDirectUploadCreateRequestContract,
  SourceAssetDirectUploadResponseContract,
} from "@/lib/models";

export function createSourceAssetDirectUpload(
  accessToken: string,
  body: SourceAssetDirectUploadCreateRequestContract,
): Promise<SourceAssetDirectUploadResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetDirectUploadResponseContract>("/source-assets/direct-uploads", {
    method: "POST",
    body,
  });
}
