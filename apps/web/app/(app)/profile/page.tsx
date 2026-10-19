import { redirect } from "next/navigation";

import { ProfileView } from "@/features/account";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
} from "@/lib/session.server";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const locale = await getRequestLocale();
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();

  if (!session?.accessToken) {
    redirect(buildLoginRedirect("/profile", getAuthRedirectReason(rawSession), locale));
  }

  return (
    <ProfileView
      session={{
        accessToken: session.accessToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt ?? "",
        account: session.account,
        user: session.user,
          brands: session.brands ?? [],
      }}
    />
  );
}
