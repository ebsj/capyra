import { LibraryView } from "@/features/source-assets";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page({ searchParams }: { searchParams: Promise<{ brandId?: string }> }) {
  const s = await requirePageSession("/library");
  const { brandId } = await searchParams;
  return <LibraryView accessToken={s.accessToken} initialBrandId={brandId} />;
}
