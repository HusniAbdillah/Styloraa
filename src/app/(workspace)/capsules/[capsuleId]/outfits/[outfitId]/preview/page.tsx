import { PreviewScreen } from "@/features/preview/components/preview-screen";
import { loadPreview } from "@/features/preview/queries";
import { studioCapabilities } from "@/features/capsules/queries";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ capsuleId: string; outfitId: string }>;
}) {
  const { capsuleId, outfitId } = await params;
  return (
    <PreviewScreen
      data={await loadPreview("capsule_outfit", outfitId, capsuleId)}
      writes={studioCapabilities().writes}
    />
  );
}
