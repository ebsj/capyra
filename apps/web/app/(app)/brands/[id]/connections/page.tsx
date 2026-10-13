import { notFound } from "next/navigation";
import { ConnectionsView } from "@/features/social";
import { listBrandsForServer } from "@/features/brands/api/brands-api.server";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requirePageSession(`/brands/${id}/connections`);
  const brand = (await listBrandsForServer(s.accessToken)).items.find((b) => b.id === id);
  if (!brand) notFound();
  return <ConnectionsView accessToken={s.accessToken} brand={brand} owner={s.user.role === "owner"} />;
}
