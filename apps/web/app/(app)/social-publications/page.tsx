import { PublicationsView } from "@/features/social";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ brandId?: string; analysisId?: string }> }) {
  const s = await requirePageSession("/social-publications");
  const p = await searchParams;
  return <PublicationsView accessToken={s.accessToken} initialBrandId={p.brandId} analysisId={p.analysisId} />;
}
