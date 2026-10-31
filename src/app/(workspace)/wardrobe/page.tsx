import { WardrobeScreen } from "@/features/wardrobe/components/wardrobe-screen";
import { wardrobeListFiltersSchema } from "@/features/wardrobe/schema";

export const dynamic = "force-dynamic";

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const parsed = wardrobeListFiltersSchema.safeParse({
    search: typeof params.search === "string" ? params.search : "",
    category: typeof params.category === "string" ? params.category : undefined,
    offset: typeof params.offset === "string" ? params.offset : 0,
    limit: 24,
  });
  const filters = parsed.success
    ? parsed.data
    : wardrobeListFiltersSchema.parse({ limit: 24 });

  return (
    <WardrobeScreen filters={filters} sampleMode={params.sample === "1"} />
  );
}
