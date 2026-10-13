import { createServerApiRequest } from "@/lib/http.server";
import type { OAuthSessionResponseContract } from "@/lib/models";

export function getOAuthSession(accessToken: string): Promise<OAuthSessionResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<OAuthSessionResponseContract>("/oauth/session");
}
