import { UsageView } from "@/features/usage";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page() {
  const s = await requirePageSession("/usage");
  return <UsageView accessToken={s.accessToken} />;
}
