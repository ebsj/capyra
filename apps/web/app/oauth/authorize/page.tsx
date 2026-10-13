import { createOAuthAuthorizationCode } from "@/features/oauth/api/oauth-api";
import { getServerTranslator } from "@/lib/i18n/server";
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

function buildNextPath(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/oauth/authorize?${query}` : "/oauth/authorize";
}

export default async function OAuthAuthorizePage({ searchParams }: PageProps) {
  const { locale, t } = await getServerTranslator();
  const params = await searchParams;
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken;
  const clientId = getSingleValue(params.client_id);
  const redirectUri = getSingleValue(params.redirect_uri);
  const state = getSingleValue(params.state);
  const codeChallenge = getSingleValue(params.code_challenge);
  const codeChallengeMethod = getSingleValue(params.code_challenge_method) ?? "S256";
  const scope = getSingleValue(params.scope);

  const nextParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      nextParams.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        nextParams.append(key, item);
      }
    }
  }

  if (!accessToken) {
    redirect(buildLoginRedirect(buildNextPath(nextParams), getAuthRedirectReason(rawSession), locale));
  }

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-display text-2xl text-foreground">{t("Autorização inválida")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t("Os parâmetros obrigatórios da autorização OAuth não foram informados corretamente.")}
          </p>
        </div>
      </main>
    );
  }

  const response = await createOAuthAuthorizationCode(accessToken, {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scopes: scope?.split(" ").filter(Boolean) ?? [],
  })
    .catch((error: unknown) => {
      return (
        <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h1 className="font-display text-2xl text-foreground">{t("Não foi possível autorizar")}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {error instanceof Error ? error.message : t("Falha inesperada ao criar o código de autorização.")}
            </p>
          </div>
        </main>
      );
    });

  if ("type" in response) {
    return response;
  }

  const target = new URL(response.redirectUri);
  target.searchParams.set("code", response.code);
  if (state) {
    target.searchParams.set("state", state);
  }

  redirect(target.toString());
}
