import { createBrowserApiRequest } from "@/lib/http";
export function assignAnalysisBrand(token: string, id: string, brandId: string) {
  return createBrowserApiRequest(token)(`/analyses/${id}/brand`, { method: "PATCH", body: { brandId } });
}
