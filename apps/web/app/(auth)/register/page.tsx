import { redirect } from "next/navigation";

import { localizePath } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { normalizeNextHref } from "@/lib/navigation";

export const metadata = {
  title: "Entrar",
};

type PageProps = {
  searchParams: Promise<{
    next?: string;
    email?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale();
  const query = new URLSearchParams();

  if (params.next) query.set("next", normalizeNextHref(params.next));
  if (params.email) query.set("email", params.email.trim().toLowerCase());

  const suffix = query.size ? `?${query.toString()}` : "";
  redirect(`${localizePath("/login", locale)}${suffix}`);
}
