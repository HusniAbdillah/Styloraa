import type { CapsuleDetail, StudioCapabilities } from "../types";
import { StudioHeading, StudioLink, ItemGrid } from "./studio-ui";
import styles from "./studio.module.css";

export function CapsuleDetailScreen({
  capsule,
  outfitCount,
  capabilities,
}: {
  capsule: CapsuleDetail;
  outfitCount: number;
  capabilities: StudioCapabilities;
}) {
  const details = [
    ["Purpose", capsule.brief.purpose],
    ["Timeframe", capsule.timeframe],
    ["Occasion", capsule.occasion],
    ["Season / climate", capsule.season],
    ["Style direction", capsule.brief.style_preferences],
    ["Fit / coverage", capsule.brief.fit_preferences],
    ["Colors", capsule.brief.color_preferences],
    ["Avoid", capsule.brief.avoid],
    ["Personal notes", capsule.brief.notes],
  ].filter(([, value]) => value);
  return (
    <div className={styles.studio}>
      <StudioHeading
        title={capsule.title}
        description={
          capsule.description || "A collection made from the pieces you chose."
        }
        back={{ href: "/capsules", label: "All capsules" }}
      >
        <StudioLink href={`/capsules/${capsule.id}/edit`} secondary>
          Edit capsule
        </StudioLink>
      </StudioHeading>
      <div className={styles.split}>
        <section className={styles.stack}>
          <div className={styles.sectionTitle}>
            <h2>The pieces, together.</h2>
            <span className={styles.pill}>
              {capsule.items.length} owned pieces
            </span>
          </div>
          <ItemGrid items={capsule.items} preview />
        </section>
        <aside className={styles.stack}>
          <section className={styles.panel}>
            <h2>Your brief</h2>
            <dl className={`${styles.summaryList} mt-6`}>
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={styles.panel}>
            <h2>See what works together.</h2>
            <p className={`${styles.muted} my-4`}>
              Explore combinations using only this capsule. Keep a piece in
              every look, or leave one out.
            </p>
            <StudioLink href={`/capsules/${capsule.id}/outfits`}>
              {outfitCount
                ? `View ${outfitCount} saved combinations`
                : "Explore combinations"}
            </StudioLink>
            {!capabilities.textAi ? (
              <p className={`${styles.muted} mt-4`}>
                AI suggestions are currently unavailable. Your saved
                combinations remain accessible.
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
