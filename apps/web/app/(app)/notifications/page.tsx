import { NotificationsView } from "@/features/notifications";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page() {
  const s = await requirePageSession("/notifications");
  return <NotificationsView accessToken={s.accessToken} owner={s.user.role === "owner"} />;
}
