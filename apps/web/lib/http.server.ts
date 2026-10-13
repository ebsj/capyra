import "server-only";

import { env } from "cloudflare:workers";
import { createApiRequest, getDefaultApiBaseUrl } from "@/lib/http";

export const fetchServerApi: typeof fetch = async (input, init) => {
  // Keep server-rendered pages and the browser proxy on the same API binding.
  const service = (env as unknown as { API?: Fetcher }).API;
  return service ? service.fetch(new Request(input, init)) : fetch(input, init);
};

export function createServerApiRequest(accessToken?: string | null) {
  return createApiRequest({ baseUrl: getDefaultApiBaseUrl(), accessToken, fetchImpl: fetchServerApi });
}
