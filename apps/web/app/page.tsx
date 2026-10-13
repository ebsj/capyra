import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/server";
import { readActiveAuthSessionFromCookieStore } from "@/lib/session.server";

export const metadata = {
  title: "Capyra MVP",
};

export default async function HomePage() {
  const locale = await getRequestLocale();
  const session = await readActiveAuthSessionFromCookieStore();
  redirect(localizePath(session ? "/dashboard" : "/login", locale));
}
