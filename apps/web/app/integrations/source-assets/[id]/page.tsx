import { UploadSessionView } from "@/features/source-assets";
import { getSourceAssetUploadSession } from "@/features/source-assets/api/source-assets-api";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
  redirectToLoginOnAuthApiError,
} from "@/lib/session.server";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SourceAssetUploadSessionPage({ params }: PageProps) {
  const locale = await getRequestLocale();
  const { id } = await params;
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    redirect(buildLoginRedirect(`/integrations/source-assets/${id}`, getAuthRedirectReason(rawSession), locale));
  }

  try {
    const uploadSession = await getSourceAssetUploadSession(accessToken, id);

    return <UploadSessionView accessToken={accessToken} initialSession={uploadSession} />;
  } catch (error) {
    redirectToLoginOnAuthApiError(error, `/integrations/source-assets/${id}`, locale);
    throw error;
  }
}
