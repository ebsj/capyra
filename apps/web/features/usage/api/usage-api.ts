import { createBrowserApiRequest } from "@/lib/http";
import type { UsageResponseContract } from "@/lib/models";
export type Usage = UsageResponseContract;
export function getUsage(token: string) {
  return createBrowserApiRequest(token)<Usage>("/usage");
}
