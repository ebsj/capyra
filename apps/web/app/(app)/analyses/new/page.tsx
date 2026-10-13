import { NewAnalysisView } from "@/features/analyses";
import { listAnalysisSkillsForServer } from "@/features/analyses/api/analyses-api";
import { listSourceAssetsForServer } from "@/features/source-assets/api/source-assets-api";
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
  title: "Nova análise",
};

export default async function NewAnalysisPage() {
  const locale = await getRequestLocale();
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect(buildLoginRedirect("/analyses/new", getAuthRedirectReason(rawSession), locale));
  }

  try {
    const [catalog, assets] = await Promise.all([
      listAnalysisSkillsForServer(accessToken),
      listSourceAssetsForServer(accessToken),
    ]);

    return (
      <NewAnalysisView
        accessToken={accessToken}
        initialAssets={assets.items}
        initialCatalog={catalog.items.filter((item) => item.status === "published")}
      />
    );
  } catch (error) {
    redirectToLoginOnAuthApiError(error, "/analyses/new", locale);
    throw error;
  }
}
