"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, LayersIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/arc/button/button";
import type { CapsuleSummary, StudioItem } from "../types";
import { CapsuleForm } from "./capsule-form";
import {
  StudioHeading,
  StudioState,
  StudioLink,
  StudioError,
  PieceBoard,
} from "./studio-ui";
import styles from "./studio.module.css";

export function CapsuleIndex({
  capsules,
  inventory,
  error,
  writes,
  initialCreate = false,
  initialIds,
  initialTitle,
}: {
  capsules: CapsuleSummary[];
  inventory: StudioItem[];
  error: string | null;
  writes: boolean;
  initialCreate?: boolean;
  initialIds?: string[];
  initialTitle?: string;
}) {
  const [creating, setCreating] = useState(initialCreate);
  const router = useRouter();
  function close() {
    setCreating(false);
    if (initialCreate) router.replace("/capsules");
  }
  return (
    <div className={styles.studio}>
      <StudioHeading
        title={
          creating ? "A capsule, built around you." : "More ways to wear less."
        }
        description={
          creating
            ? "Tell us what you need, then choose the pieces you want to bring together."
            : "Build a collection around a purpose, using the pieces you already have."
        }
      >
        {!creating ? (
          <Button onClick={() => setCreating(true)} disabled={!!error}>
            <PlusIcon aria-hidden="true" />
            Create capsule
          </Button>
        ) : null}
      </StudioHeading>
      {error ? (
        <>
          <StudioError message={error} />
          <Button variant="secondary" onClick={() => router.refresh()}>
            Try again
          </Button>
        </>
      ) : creating ? (
        <CapsuleForm
          inventory={inventory}
          writes={writes}
          onCancel={close}
          initialIds={initialIds}
          initialTitle={initialTitle}
        />
      ) : !capsules.length ? (
        <StudioState
          title="Your wardrobe. New possibilities."
          action={
            <Button onClick={() => setCreating(true)}>
              Create your first capsule
            </Button>
          }
        >
          <p>
            Gather a few owned pieces around a purpose. Your brief and selection
            will be saved together.
          </p>
        </StudioState>
      ) : (
        <div className={styles.cards}>
          {capsules.map((capsule) => (
            <article className={styles.card} key={capsule.id}>
              <PieceBoard
                items={inventory.filter((item) =>
                  capsule.item_ids.includes(item.id),
                )}
              />
              <div className={styles.meta}>
                <LayersIcon width={20} height={20} aria-hidden="true" />
                <span>{capsule.item_count} pieces</span>
                <span>{capsule.outfit_count} saved combinations</span>
              </div>
              <h2>{capsule.title}</h2>
              <p className={styles.muted}>
                {capsule.description ||
                  "A considered collection of your owned pieces."}
              </p>
              <div className={styles.meta}>
                {[capsule.occasion, capsule.season, capsule.timeframe]
                  .filter(Boolean)
                  .map((value, index) => (
                    <span key={index}>{value}</span>
                  ))}
              </div>
              <div className={styles.cardFoot}>
                <StudioLink href={`/capsules/${capsule.id}`} secondary>
                  Open capsule
                </StudioLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
