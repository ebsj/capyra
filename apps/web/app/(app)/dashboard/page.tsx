import { DashboardView } from "@/features/analyses";
import { listAnalyses } from "@/features/analyses/api/analyses-api";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
  redirectToLoginOnAuthApiError,
} from "@/lib/session.server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect(buildLoginRedirect("/dashboard", getAuthRedirectReason(rawSession), locale));
  }

  try {
    const history = await listAnalyses(accessToken);

    return (
      <DashboardView
        items={history.items}
        session={{
          accessToken,
          tokenType: session.tokenType,
          expiresAt: session.expiresAt ?? "",
          account: session.account,
          user: session.user,
          brands: session.brands ?? [],
        }}
      />
    );
  } catch (error) {
    redirectToLoginOnAuthApiError(error, "/dashboard", locale);
    throw error;
  }
}
