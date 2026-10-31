import { StaticWardrobePreview } from "@/features/wardrobe/components/static-wardrobe-preview";
import { getDemoWardrobeEntry } from "@/features/wardrobe/demo-wardrobe";
import { isDatabaseConfigured } from "@/lib/env";
import { getSavedStaticWardrobeItem } from "@/features/wardrobe/repository";
import { PreviewPage } from "@/features/preview/components/preview-page";
import { categories } from "@/features/wardrobe/schema";

export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const data = await params;
  const staticEntry = getDemoWardrobeEntry(data.itemId);
  if (staticEntry) {
    const storedItem = isDatabaseConfigured()
      ? await getSavedStaticWardrobeItem(staticEntry.id)
      : null;
    const savedItem = storedItem
      ? {
          ...storedItem,
          category: categories.includes(
            storedItem.category as (typeof categories)[number],
          )
            ? (storedItem.category as (typeof categories)[number])
            : staticEntry.category,
        }
      : null;
    return <StaticWardrobePreview item={staticEntry} savedItem={savedItem} />;
  }
  return <PreviewPage type="wardrobe_item" id={data.itemId} />;
}
