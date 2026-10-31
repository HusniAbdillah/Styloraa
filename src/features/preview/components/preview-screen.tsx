"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/arc/button/button";
import { studioRequest, requestMessage } from "@/features/capsules/api-client";
import { SaveAsCapsule } from "@/features/capsules/components/save-as-capsule";
import {
  StudioHeading,
  PieceBoard,
  StudioError,
} from "@/features/capsules/components/studio-ui";
import styles from "@/features/capsules/components/studio.module.css";
import type { PreviewJob, PreviewScreenData } from "../types";
import { useClientReady } from "@/lib/use-client-ready";

export function PreviewScreen({
  data,
  writes,
}: {
  data: PreviewScreenData;
  writes: boolean;
}) {
  const ready = useClientReady();
  const [mode, setMode] = useState<"single" | "combo">(
    data.latestJob?.input.mode === "single"
      ? "single"
      : data.latestJob?.input.mode === "combo"
        ? "combo"
        : data.items.length > 1
          ? "combo"
          : "single",
  );
  const [selectedIds, setSelectedIds] = useState(
    (!data.latestJob?.stale ? data.latestJob?.input.item_ids : undefined) ??
      data.items.map((item) => item.id),
  );
  const [consent, setConsent] = useState(false);
  const [limits, setLimits] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<PreviewJob | null>(data.latestJob);
  const [pollError, setPollError] = useState("");
  const [retryPoll, setRetryPoll] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  const selected = data.pool.filter((item) => selectedIds.includes(item.id));
  const unavailable =
    data.items.length === 0 || data.items.some((item) => !item.available);
  const activeJobId =
    job && !job.stale && (job.status === "queued" || job.status === "running")
      ? job.id
      : null;
  const stale =
    job?.stale ||
    (job?.input.item_ids &&
      [...job.input.item_ids].sort().join() !== [...selectedIds].sort().join());

  useEffect(
    () => () => {
      requestController.current?.abort();
    },
    [],
  );
  useEffect(() => {
    if (!activeJobId) return;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const started = Date.now();
    async function poll() {
      try {
        const next = await studioRequest<PreviewJob>(
          `/api/preview/jobs/${activeJobId}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (
          next.input.subject_id !== data.subject.id ||
          next.input.subject_type !== data.subject.type ||
          (data.subject.capsuleId &&
            next.input.capsule_id !== data.subject.capsuleId)
        )
          throw new Error("Preview context changed.");
        setJob(next);
        if (next.status === "queued" || next.status === "running") {
          if (Date.now() - started > 120000) {
            setPollError(
              "This preview is taking longer than expected. Check its status again.",
            );
            return;
          }
          timeout = setTimeout(poll, Math.min(1500 * 2 ** attempt++, 10000));
        }
      } catch {
        if (!controller.signal.aborted)
          setPollError(
            "We could not check the preview. Your selection is unchanged.",
          );
      }
    }
    timeout = setTimeout(poll, 1000);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [
    activeJobId,
    retryPoll,
    data.subject.id,
    data.subject.type,
    data.subject.capsuleId,
  ]);

  function changeSelection(ids: string[], nextMode = mode) {
    requestController.current?.abort();
    setPending(false);
    setSelectedIds(ids);
    setMode(nextMode);
    setError("");
    setPollError("");
    setConsent(false);
    setLimits(false);
    if (job)
      setJob({
        ...job,
        stale: true,
        status: job.status === "succeeded" ? "succeeded" : "failed",
      });
  }
  async function generate() {
    setPending(true);
    setError("");
    setPollError("");
    setJob(null);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const next = await studioRequest<PreviewJob>(data.endpoint, {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          option_id: data.subject.optionId,
          subject_type: data.subject.type,
          subject_id: data.subject.id,
          capsule_id: data.subject.capsuleId,
          mode,
          item_ids: selectedIds,
          model_source: "mannequin",
          consent_acknowledged: consent,
          limitations_acknowledged: limits,
        }),
      });
      if (!controller.signal.aborted) setJob(next);
    } catch (failure) {
      if (!controller.signal.aborted) setError(requestMessage(failure));
    } finally {
      if (!controller.signal.aborted) setPending(false);
    }
  }
  async function deleteResult() {
    if (!job) return;
    setPending(true);
    setError("");
    try {
      await studioRequest(`/api/preview/jobs/${job.id}`, { method: "DELETE" });
      setJob(null);
      setConfirmDelete(false);
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.studio}>
      <StudioHeading
        title={
          data.subject.type === "wardrobe_item"
            ? "See a piece differently."
            : "See the look come together."
        }
        description={data.title}
        back={data.back}
      />
      {error ? <StudioError message={error} /> : null}
      {unavailable ? (
        <p className={styles.notice}>
          This selection includes unavailable pieces. A preview can only use
          owned, available items.
        </p>
      ) : null}
      <div className={styles.split}>
        <section className={styles.stack}>
          <div className={styles.sectionTitle}>
            <h2>Your selected pieces</h2>
            <span className={styles.pill}>{selected.length} selected</span>
          </div>
          <PieceBoard items={selected} />
          {data.subject.type === "look" ? (
            <SaveAsCapsule
              lookId={data.subject.id}
              selectedItemIds={selectedIds}
              sourceOptionId={data.subject.optionId}
              disabled={unavailable}
            />
          ) : null}
          {data.subject.type !== "wardrobe_item" ? (
            <details className={styles.panel}>
              <summary className={styles.disclosureTitle}>
                Refine the composition
              </summary>
              <p className={`${styles.muted} mt-3`}>
                Choose from owned pieces. Changing the selection makes an
                earlier preview out of date.
              </p>
              <div className={styles.constraints}>
                {data.pool
                  .filter((item) => item.available)
                  .map((item) => (
                    <label className={styles.consent} key={item.id}>
                      <input
                        type={mode === "single" ? "radio" : "checkbox"}
                        name="preview-piece"
                        checked={selectedIds.includes(item.id)}
                        onChange={(event) =>
                          changeSelection(
                            mode === "single"
                              ? [item.id]
                              : event.target.checked
                                ? [...selectedIds, item.id]
                                : selectedIds.filter((id) => id !== item.id),
                          )
                        }
                      />
                      {item.name}
                    </label>
                  ))}
              </div>
            </details>
          ) : null}
        </section>
        <aside className={styles.stack}>
          <section className={styles.panel}>
            <h2>Preview the {mode === "single" ? "piece" : "outfit"}</h2>
            <div
              className={`${styles.modeTabs} my-6`}
              aria-label="Preview mode"
            >
              <button
                type="button"
                aria-pressed={mode === "single"}
                disabled={!ready}
                onClick={() =>
                  changeSelection(selectedIds.slice(0, 1), "single")
                }
              >
                Single item
              </button>
              <button
                type="button"
                aria-pressed={mode === "combo"}
                disabled={
                  !ready ||
                  data.subject.type === "wardrobe_item" ||
                  data.pool.filter((item) => item.available).length < 2
                }
                onClick={() =>
                  changeSelection(
                    data.items
                      .filter((item) => item.available)
                      .map((item) => item.id),
                    "combo",
                  )
                }
              >
                Full outfit
              </button>
            </div>
            <div className={styles.previewCanvas} aria-live="polite">
              {job?.status === "succeeded" && job.image_url && !stale ? (
                <Image
                  src={job.image_url}
                  alt={`Generated visual preview of ${data.title}`}
                  width={600}
                  height={800}
                  unoptimized
                  className={styles.previewResult}
                />
              ) : (
                <>
                  <ImageIcon width={32} height={32} aria-hidden="true" />
                  <h2>
                    {stale
                      ? "Your selection has changed."
                      : pending
                        ? "Requesting your preview…"
                        : activeJobId
                          ? job?.status === "running"
                            ? "Your preview is being created."
                            : "Your preview is queued."
                          : job?.status === "failed"
                            ? "The preview could not be created."
                            : "Your pieces, in perspective."}
                  </h2>
                  <p>
                    {stale
                      ? "Request a new preview to use these pieces."
                      : activeJobId
                        ? "You can check its status here. The saved combination stays unchanged."
                        : "A visual preview will appear here when generation is available. It is not a size or fit assessment."}
                  </p>
                </>
              )}
            </div>
            {pollError ? (
              <>
                <p role="alert" className={`${styles.notice} mt-4`}>
                  {pollError}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPollError("");
                    setRetryPoll((value) => value + 1);
                  }}
                >
                  Check status again
                </Button>
              </>
            ) : null}
            <p className={`${styles.muted} mt-6`}>
              Use a non-identifying model. No personal photo is needed.
              Generated images can change color, texture, and proportions.
            </p>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              I agree to send these selected garment details and images to the
              preview provider.
            </label>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={limits}
                onChange={(event) => setLimits(event.target.checked)}
              />
              I understand this is a visualization, not a prediction of fit.
            </label>
            <Button
              onClick={generate}
              loading={pending}
              disabled={
                !data.visualAi ||
                !writes ||
                !consent ||
                !limits ||
                unavailable ||
                !selected.length ||
                (mode === "combo" && selected.length < 2) ||
                !!activeJobId
              }
            >
              Request visual preview
            </Button>
            {!data.visualAi ? (
              <p className={styles.muted}>
                Muse Image is currently unavailable. Your selection is kept.
              </p>
            ) : null}
            <p className={styles.muted}>
              Muse Image creates an approximate visualization on a
              non-identifying mannequin using your garment photos and explicitly
              selected style preferences. Up to six pieces, 12 MB total.
            </p>
            {!writes ? (
              <p className={`${styles.muted} mt-4`}>
                Preview requests are currently disabled.
              </p>
            ) : null}
            {job?.status === "succeeded" || job?.status === "failed" ? (
              <div className="mt-4">
                {confirmDelete ? (
                  <div className={styles.stack}>
                    <p className={styles.muted}>
                      Delete this generated preview and its image? Your owned
                      pieces and saved outfit will stay.
                    </p>
                    <div className={styles.actions}>
                      <Button
                        variant="danger"
                        onClick={deleteResult}
                        disabled={!writes}
                        loading={pending}
                      >
                        Delete preview
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Keep preview
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete preview
                  </Button>
                )}
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
