import { createBrowserApiRequest } from "@/lib/http";
import type { AuthSessionResponseContract, FirebaseEmailLinkSignInRequestContract } from "@/lib/models";

export function signInWithFirebaseEmailLink(
  body: FirebaseEmailLinkSignInRequestContract,
): Promise<AuthSessionResponseContract> {
  const request = createBrowserApiRequest();
  return request<AuthSessionResponseContract>("/auth/email-link", { method: "POST", body });
}
