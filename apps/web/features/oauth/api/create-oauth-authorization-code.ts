import { createServerApiRequest } from "@/lib/http.server";
import type {
  OAuthAuthorizationCodeCreateRequestContract,
  OAuthAuthorizationCodeResponseContract,
} from "@/lib/models";

export function createOAuthAuthorizationCode(
  accessToken: string,
  body: OAuthAuthorizationCodeCreateRequestContract,
): Promise<OAuthAuthorizationCodeResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<OAuthAuthorizationCodeResponseContract>("/oauth/authorization-codes", {
    method: "POST",
    body,
  });
}
