import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/server";
import { readActiveAuthSessionFromCookieStore, buildLoginRedirect } from "@/lib/session.server";
export async function requirePageSession(path: string) {
  const locale = await getRequestLocale();
  const session = await readActiveAuthSessionFromCookieStore();
  if (!session?.accessToken) redirect(buildLoginRedirect(path, "auth-required", locale));
  return { ...session, accessToken: session.accessToken };
}
