import { PreviewScreen } from "@/features/preview/components/preview-screen";
import { loadPreview } from "@/features/preview/queries";
import { studioCapabilities } from "@/features/capsules/queries";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return (
    <PreviewScreen
      data={await loadPreview("wardrobe_item", itemId)}
      writes={studioCapabilities().writes}
    />
  );
}
