import { createBrowserApiRequest } from "@/lib/http";
import type { SourceAssetItemContract } from "@/lib/models";

export function createSourceAssetMultipart(accessToken: string, file: File, brandId: string): Promise<SourceAssetItemContract> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("brandId", brandId);

  const request = createBrowserApiRequest(accessToken);
  return request<SourceAssetItemContract>("/source-assets", { method: "POST", body: formData });
}
