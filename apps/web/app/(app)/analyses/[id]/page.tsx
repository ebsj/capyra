import { APP_HOME_PATH, VIDEO_ANALYSIS_ENABLED } from "@/lib/features";
import { localizePath } from "@/lib/i18n/config";
import { notFound, redirect } from "next/navigation";

import { AnalysisDetailView } from "@/features/analyses";
import {
  ApiError,
  getAnalysis,
  getAnalysisFeedbackReactionsForServer,
} from "@/features/analyses/api/analyses-api";
import { getRequestLocale } from "@/lib/i18n/server";
import type { MyFeedbackReactionListResponseContract } from "@/lib/models";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
  redirectToLoginOnAuthApiError,
} from "@/lib/session.server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata = {
  title: "Detalhe da análise",
};

const emptyReactions: MyFeedbackReactionListResponseContract = { items: [] };

function isFeedbackUnavailable(error: unknown) {
  return error instanceof ApiError && error.status === 400 && error.code === "feedback_reactions_unavailable";
}

async function getReactionStateForDetail(
  accessToken: string,
  analysisId: string,
): Promise<MyFeedbackReactionListResponseContract> {
  try {
    return await getAnalysisFeedbackReactionsForServer(accessToken, analysisId);
  } catch (error) {
    if (isFeedbackUnavailable(error)) {
      return emptyReactions;
    }

    throw error;
  }
}

export default async function AnalysisDetailPage({ params }: Props) {
  const locale = await getRequestLocale();
  const { id } = await params;
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect(buildLoginRedirect(`/analyses/${id}`, getAuthRedirectReason(rawSession), locale));
  }

  if (!VIDEO_ANALYSIS_ENABLED) {
    redirect(localizePath(APP_HOME_PATH, locale));
  }

  try {
    const [analysis, myFeedbackReactions] = await Promise.all([
      getAnalysis(accessToken, id),
      getReactionStateForDetail(accessToken, id),
    ]);
    return (
      <AnalysisDetailView
        analysis={analysis}
        accessToken={accessToken}
        reviewer={session.user}
        myFeedbackReactions={myFeedbackReactions}
      />
    );
  } catch (error) {
    redirectToLoginOnAuthApiError(error, `/analyses/${id}`, locale);

    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
