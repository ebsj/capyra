import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
  redirectToLoginOnAuthApiError,
} from "@/lib/session.server";
import {listBrandsForServer} from "@/features/brands/api/brands-api.server";
import { listAnalyses } from "@/features/analyses/api/analyses-api";
import { getRequestLocale } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import { AnalysesIndexView } from "@/features/analyses";

export const metadata = {
  title: "Analyses",
};

export default async function AnalysesPage() {
  const locale = await getRequestLocale();
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect(buildLoginRedirect("/analyses", getAuthRedirectReason(rawSession), locale));
  }

  try {
    const [history,brands] = await Promise.all([listAnalyses(accessToken),listBrandsForServer(accessToken)]);

    return <AnalysesIndexView items={history.items} brands={brands.items} />;
  } catch (error) {
    redirectToLoginOnAuthApiError(error, "/analyses", locale);
    throw error;
  }
}
