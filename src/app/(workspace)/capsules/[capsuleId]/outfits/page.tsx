import { CapsuleOutfits } from "@/features/capsules/components/capsule-outfits";
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
    <CapsuleOutfits
      capsule={capsule}
      saved={outfits}
      capabilities={studioCapabilities()}
    />
  );
}
