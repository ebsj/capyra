import { DeviceActivationView } from "@/features/oauth";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
} from "@/lib/session.server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OAuthDevicePage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;
  const userCode = getSingleValue(params.user_code);
  const clientId = getSingleValue(params.client_id);

  if (!accessToken) {
    const query = new URLSearchParams();
    if (userCode) {
      query.set("user_code", userCode);
    }
    if (clientId) {
      query.set("client_id", clientId);
    }

    const nextPath = query.size > 0 ? `/oauth/device?${query.toString()}` : "/oauth/device";
    redirect(buildLoginRedirect(nextPath, getAuthRedirectReason(rawSession), locale));
  }

  return <DeviceActivationView accessToken={accessToken} clientId={clientId ?? null} userCode={userCode ?? ""} />;
}
