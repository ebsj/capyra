import { createServerApiRequest } from "@/lib/http.server";
import type { SourceAssetUploadSessionResponseContract } from "@/lib/models";

export function getSourceAssetUploadSession(
  accessToken: string,
  sessionId: string,
): Promise<SourceAssetUploadSessionResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<SourceAssetUploadSessionResponseContract>(
    `/integrations/source-asset-sessions/${sessionId}`,
  );
}
