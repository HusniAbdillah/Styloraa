import styles from "@/features/capsules/components/studio.module.css";
export default function Loading() {
  return (
    <div
      className={styles.studio}
      role="status"
      aria-label="Loading capsule studio"
    >
      <div className={styles.cards}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
      <span className="sr-only">Loading your capsules…</span>
    </div>
  );
}
