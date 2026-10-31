import {
  StudioHeading,
  StudioLink,
  PieceBoard,
  SourceNote,
} from "@/features/capsules/components/studio-ui";
import { loadOutfit } from "@/features/capsules/queries";
import styles from "@/features/capsules/components/studio.module.css";
import { DeleteOutfit } from "@/features/capsules/components/delete-outfit";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ capsuleId: string; outfitId: string }>;
}) {
  const { capsuleId, outfitId } = await params;
  const outfit = await loadOutfit(capsuleId, outfitId);
  return (
    <div className={styles.studio}>
      <StudioHeading
        title={outfit.title}
        back={{
          href: `/capsules/${capsuleId}/outfits`,
          label: "All combinations",
        }}
      />
      <div className={styles.split}>
        <PieceBoard items={outfit.items} />
        <section className={`${styles.panel} ${styles.stack}`}>
          <SourceNote source={outfit.source_type} />
          <h2>Why this works</h2>
          <p>{outfit.rationale}</p>
          {outfit.uncertainty ? (
            <p className={styles.muted}>{outfit.uncertainty}</p>
          ) : null}
          <p className={styles.meta}>
            {outfit.items.length} pieces from this capsule.
          </p>
          {outfit.items.some((item) => !item.available) ? (
            <p className={styles.notice}>
              Some pieces are no longer available. Edit the capsule before
              making a new combination.
            </p>
          ) : (
            <StudioLink
              href={`/capsules/${capsuleId}/outfits/${outfitId}/preview`}
            >
              Preview this combination
            </StudioLink>
          )}
          <StudioLink href={`/capsules/${capsuleId}/outfits`} secondary>
            Try another combination
          </StudioLink>
          <DeleteOutfit capsuleId={capsuleId} outfitId={outfitId} />
        </section>
      </div>
    </div>
  );
}
