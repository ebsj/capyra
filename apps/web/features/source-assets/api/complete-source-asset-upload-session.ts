import { createBrowserApiRequest } from "@/lib/http";
import type {
  SourceAssetUploadSessionCompleteRequestContract,
  SourceAssetUploadSessionResponseContract,
} from "@/lib/models";

export function completeSourceAssetUploadSession(
  accessToken: string,
  sessionId: string,
  body: SourceAssetUploadSessionCompleteRequestContract,
): Promise<SourceAssetUploadSessionResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetUploadSessionResponseContract>(
    `/integrations/source-asset-sessions/${sessionId}/complete`,
    { method: "POST", body },
  );
}
