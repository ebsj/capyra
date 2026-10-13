import { createBrowserApiRequest } from "@/lib/http";
import type {
  SourceAssetUploadSessionCreateRequestContract,
  SourceAssetUploadSessionResponseContract,
} from "@/lib/models";

export function createSourceAssetUploadSession(
  accessToken: string,
  body: SourceAssetUploadSessionCreateRequestContract,
): Promise<SourceAssetUploadSessionResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetUploadSessionResponseContract>("/integrations/source-asset-sessions", {
    method: "POST",
    body,
  });
}
