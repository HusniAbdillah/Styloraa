import { CapsuleDetailScreen } from "@/features/capsules/components/capsule-detail";
import {
  loadCapsule,
  loadCapsuleOutfits,
  studioCapabilities,
} from "@/features/capsules/queries";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ capsuleId: string }>;
}) {
  const { capsuleId } = await params;
  const [capsule, outfits] = await Promise.all([
    loadCapsule(capsuleId),
    loadCapsuleOutfits(capsuleId),
  ]);
  return (
    <CapsuleDetailScreen
      capsule={capsule}
      outfitCount={outfits.length}
      capabilities={studioCapabilities()}
    />
  );
}
