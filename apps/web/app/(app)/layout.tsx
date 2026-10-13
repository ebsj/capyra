import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { listBrandsForServer } from "@/features/brands/api/brands-api.server";
import { AppShell } from "@/components/app-shell";
import { getRequestLocale } from "@/lib/i18n/server";
import {
  buildLoginRedirect,
  getAuthRedirectReason,
  readActiveAuthSessionFromCookieStore,
  readAuthSessionFromCookieStore,
} from "@/lib/session.server";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getRequestLocale();
  const rawSession = await readAuthSessionFromCookieStore();
  const session = await readActiveAuthSessionFromCookieStore();

  if (!session?.accessToken) {
    redirect(buildLoginRedirect("/dashboard", getAuthRedirectReason(rawSession), locale));
  }

  const accessToken = session.accessToken;
  const brands = await listBrandsForServer(accessToken);

  return (
    <AppShell
      session={{
        accessToken,
        tokenType: session.tokenType,
        expiresAt: session.expiresAt ?? "",
        account: session.account,
        user: session.user,
          brands: brands.items,
      }}
    >
      {children}
    </AppShell>
  );
}
