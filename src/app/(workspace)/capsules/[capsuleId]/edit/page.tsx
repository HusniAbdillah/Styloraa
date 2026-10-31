import { CapsuleForm } from "@/features/capsules/components/capsule-form";
import { StudioHeading } from "@/features/capsules/components/studio-ui";
import {
  loadCapsule,
  loadStudioInventory,
  studioCapabilities,
} from "@/features/capsules/queries";
import styles from "@/features/capsules/components/studio.module.css";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ capsuleId: string }>;
}) {
  const { capsuleId } = await params;
  const [capsule, inventory] = await Promise.all([
    loadCapsule(capsuleId),
    loadStudioInventory(),
  ]);
  return (
    <div className={styles.studio}>
      <StudioHeading
        title="A little more you."
        description="Update the brief or refine your selected pieces."
        back={{ href: `/capsules/${capsule.id}`, label: "Back to capsule" }}
      />
      <CapsuleForm
        inventory={inventory}
        capsule={capsule}
        writes={studioCapabilities().writes}
      />
    </div>
  );
}
