"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/arc/button/button";
import { studioRequest, requestMessage } from "../api-client";
import { StudioError } from "./studio-ui";
import styles from "./studio.module.css";
export function DeleteOutfit({
  capsuleId,
  outfitId,
}: {
  capsuleId: string;
  outfitId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await studioRequest(`/api/capsules/${capsuleId}/outfits/${outfitId}`, {
        method: "DELETE",
      });
      router.push(`/capsules/${capsuleId}/outfits`);
      router.refresh();
    } catch (failure) {
      setError(requestMessage(failure));
      setBusy(false);
    }
  }
  return (
    <div className={styles.stack}>
      {error ? <StudioError message={error} /> : null}
      {confirm ? (
        <>
          <p className={styles.muted}>
            Remove this saved combination? Your capsule and wardrobe pieces will
            stay.
          </p>
          <div className={styles.actions}>
            <Button variant="danger" loading={busy} onClick={remove}>
              Remove combination
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep combination
            </Button>
          </div>
        </>
      ) : (
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Remove combination
        </Button>
      )}
    </div>
  );
}
