import { BrandsView } from "@/features/brands";
import { listBrandsForServer } from "@/features/brands/api/brands-api.server";
import { requirePageSession } from "@/lib/authenticated-page";
export default async function Page() {
  const s = await requirePageSession("/brands");
  const brands = await listBrandsForServer(s.accessToken);
  return <BrandsView accessToken={s.accessToken} initialBrands={brands.items} owner={s.user.role === "owner"} />;
}
