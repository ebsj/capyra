import { createBrowserApiRequest } from "@/lib/http";
import type { SourceAssetItemContract } from "@/lib/models";
export function listLibraryAssets(token: string, brandId: string) {
  return createBrowserApiRequest(token)<{ items: SourceAssetItemContract[] }>(`/source-assets?brandId=${encodeURIComponent(brandId)}`);
}
export function removeLibraryAsset(token: string, id: string) {
  return createBrowserApiRequest(token)(`/source-assets/${id}`, { method: "DELETE" });
}
export function getLibraryAsset(token: string, id: string) {
  return createBrowserApiRequest(token)<SourceAssetItemContract>(`/source-assets/${id}`);
}
