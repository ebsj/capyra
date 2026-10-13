import { PublicationDetailView } from "@/features/social";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ analysisId?: string }> }) {
  const { id } = await params;
  const s = await requirePageSession(`/social-publications/${id}`);
  const { analysisId } = await searchParams;
  return <PublicationDetailView accessToken={s.accessToken} id={id} analysisId={analysisId} />;
}
