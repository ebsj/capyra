import { createBrowserApiRequest } from "@/lib/http";
import type { Brand } from "../types/brand";
export function listBrands(token: string) {
  return createBrowserApiRequest(token)<{ items: Brand[] }>("/brands");
}
export function saveBrand(token: string, body: { name: string; timeZone: string; confirmed?: boolean }, id?: string) {
  return createBrowserApiRequest(token)<Brand>(id ? `/brands/${id}` : "/brands", { method: id ? "PATCH" : "POST", body });
}
export function changeBrandStatus(token: string, id: string, action: "archive" | "restore") {
  return createBrowserApiRequest(token)<Brand>(`/brands/${id}/${action}`, { method: "POST" });
}
