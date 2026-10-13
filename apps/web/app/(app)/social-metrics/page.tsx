import { AnalyticsView } from "@/features/social";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ brandId?: string }> }) {
  const s = await requirePageSession("/social-metrics");
  const { brandId } = await searchParams;
  return <AnalyticsView accessToken={s.accessToken} initialBrandId={brandId} />;
}
