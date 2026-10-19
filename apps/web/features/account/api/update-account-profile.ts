import { createBrowserApiRequest } from "@/lib/http";
import type { UpdateAccountProfileRequestContract } from "@/lib/models";

export function updateAccountProfile(
  accessToken: string | null,
  body: UpdateAccountProfileRequestContract,
): Promise<void> {
  const request = createBrowserApiRequest(accessToken);
  return request<void>("/auth/account", { method: "PATCH", body });
}
