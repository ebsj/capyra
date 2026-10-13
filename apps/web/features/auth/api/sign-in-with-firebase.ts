import { createBrowserApiRequest } from "@/lib/http";
import type { AuthSessionResponseContract, FirebaseSignInRequestContract } from "@/lib/models";

export function signInWithFirebase(body: FirebaseSignInRequestContract): Promise<AuthSessionResponseContract> {
  const request = createBrowserApiRequest();
  return request<AuthSessionResponseContract>("/auth/firebase", { method: "POST", body });
}
