import { TeamView } from "@/features/team";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page() {
  const s = await requirePageSession("/team");
  return <TeamView accessToken={s.accessToken} owner={s.user.role === "owner"} />;
}
