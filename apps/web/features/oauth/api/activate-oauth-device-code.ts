import { createBrowserApiRequest } from "@/lib/http";
import type { OAuthDeviceActivationRequestContract } from "@/lib/models";

export function activateOAuthDeviceCode(
  accessToken: string,
  body: OAuthDeviceActivationRequestContract,
): Promise<void> {
  const request = createBrowserApiRequest(accessToken);
  return request<void>("/oauth/device/activate", { method: "POST", body });
}
