export function invitationTokenFromNext(nextHref: string): string | undefined {
  const url = new URL(nextHref, "https://capyra.invalid");
  if (url.origin !== "https://capyra.invalid" || !url.pathname.endsWith("/invitations/accept")) return undefined;
  return url.searchParams.get("token") || undefined;
}
