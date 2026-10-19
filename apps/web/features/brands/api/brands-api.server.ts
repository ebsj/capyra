import { createServerApiRequest } from "@/lib/http.server";
import type { Brand } from "../types/brand";
export function listBrandsForServer(token: string) {
  return createServerApiRequest(token)<{ items: Brand[] }>("/brands");
}
