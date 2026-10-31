import { PreviewPage } from "@/features/preview/components/preview-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ capsuleId: string; outfitId: string }>;
}) {
  const data = await params;
  return (
    <PreviewPage
      type="capsule_outfit"
      id={data.outfitId}
      capsuleId={data.capsuleId}
    />
  );
}
