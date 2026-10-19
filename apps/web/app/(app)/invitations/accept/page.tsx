import { AcceptInvitationView } from "@/features/team";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const s = await requirePageSession(`/invitations/accept?token=${encodeURIComponent(token)}`);
  return <AcceptInvitationView accessToken={s.accessToken} token={token} />;
}
