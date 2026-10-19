import { createBrowserApiRequest } from "@/lib/http";
import type { BrandCreateRequestContract, BrandUpdateRequestContract } from "@/lib/models";
import type { Brand } from "../types/brand";
export function listBrands(token: string) {
  return createBrowserApiRequest(token)<{ items: Brand[] }>("/brands");
}
export function saveBrand(token: string, body: BrandCreateRequestContract & Pick<BrandUpdateRequestContract, "confirmed">, id?: string) {
  const request = createBrowserApiRequest(token);
  if (id) {
    const update: BrandUpdateRequestContract = { name: body.name, timeZone: body.timeZone, confirmed: body.confirmed };
    return request<Brand>(`/brands/${id}`, { method: "PATCH", body: update });
  }
  // Creation already confirms the Brand; confirmed is accepted only on updates.
  const create: BrandCreateRequestContract = { name: body.name, timeZone: body.timeZone };
  return request<Brand>("/brands", { method: "POST", body: create });
}
export function changeBrandStatus(token: string, id: string, action: "archive" | "restore") {
  return createBrowserApiRequest(token)<Brand>(`/brands/${id}/${action}`, { method: "POST" });
}
