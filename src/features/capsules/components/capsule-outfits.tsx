"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Textarea } from "@/components/arc/textarea/textarea";
import type { CapsuleDetail, Combination, StudioCapabilities } from "../types";
import { studioRequest, requestMessage } from "../api-client";
import {
  StudioHeading,
  StudioError,
  StudioLink,
  PieceBoard,
  SourceNote,
} from "./studio-ui";
import styles from "./studio.module.css";

type SavedOutfit = {
  id: string;
  title: string;
  rationale: string;
  source_type: string;
  uncertainty: string;
};
type Suggestion = Combination & { draft_token?: string };

export function CapsuleOutfits({
  capsule,
  saved,
  capabilities,
}: {
  capsule: CapsuleDetail;
  saved: SavedOutfit[];
  capabilities: StudioCapabilities;
}) {
  const router = useRouter();
  const [constraints, setConstraints] = useState<Record<string, string>>({});
  const [count, setCount] = useState(3);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState(false);
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [rationale, setRationale] = useState("");
  const available = capsule.items.filter((item) => item.available);

  async function generate() {
    setBusy("generate");
    setError("");
    setNotice("");
    setSuggestions([]);
    try {
      const data = await studioRequest<{
        combinations: Suggestion[];
        source: string;
        dropped?: number;
      }>(`/api/capsules/${capsule.id}/combinations`, {
        method: "POST",
        body: JSON.stringify({
          source: "ai",
          count,
          required_item_ids: Object.keys(constraints).filter(
            (id) => constraints[id] === "required",
          ),
          excluded_item_ids: Object.keys(constraints).filter(
            (id) => constraints[id] === "excluded",
          ),
        }),
      });
      if (data.source !== "ai")
        throw new Error("Unexpected suggestion source.");
      setSuggestions(data.combinations);
      if (data.dropped)
        setNotice(
          "Some suggestions could not be verified and were left out. Only verified combinations are shown.",
        );
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  async function save(
    combination: Suggestion,
    key: string,
    source: "manual" | "live",
  ) {
    setError("");
    setBusy(key);
    try {
      const result = await studioRequest<{ id: string }>(
        `/api/capsules/${capsule.id}/outfits`,
        {
          method: "POST",
          body: JSON.stringify({ ...combination, source_type: source }),
        },
      );
      router.push(`/capsules/${capsule.id}/outfits/${result.id}`);
      router.refresh();
    } catch (failure) {
      setError(requestMessage(failure));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.studio}>
      <StudioHeading
        title="A few ways to wear it."
        description={`Combinations from ${capsule.title}, guided by your brief.`}
        back={{ href: `/capsules/${capsule.id}`, label: "Back to capsule" }}
      />
      {error ? <StudioError message={error} /> : null}
      {notice ? (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      ) : null}
      <div className={styles.split}>
        <section className={styles.stack}>
          {suggestions.length ? (
            <>
              <h2 className="text-xl font-medium">Your new suggestions</h2>
              {suggestions.map((suggestion, index) => (
                <article
                  className={styles.card}
                  key={`${index}:${suggestion.title}`}
                >
                  <SourceNote source="live" />
                  <PieceBoard
                    items={capsule.items.filter((item) =>
                      suggestion.item_ids.includes(item.id),
                    )}
                  />
                  <h2>{suggestion.title}</h2>
                  <p>{suggestion.rationale}</p>
                  {suggestion.uncertainty ? (
                    <p className={styles.muted}>{suggestion.uncertainty}</p>
                  ) : null}
                  <p className={styles.meta}>
                    Uses your selected pieces and the saved capsule brief.
                  </p>
                  <Button
                    disabled={!capabilities.writes || busy !== null}
                    loading={busy === `save-${index}`}
                    onClick={() => save(suggestion, `save-${index}`, "live")}
                  >
                    Save this combination
                  </Button>
                </article>
              ))}
            </>
          ) : null}
          <h2 className="text-xl font-medium">Saved combinations</h2>
          {saved.length ? (
            saved.map((outfit) => (
              <article className={styles.card} key={outfit.id}>
                <SourceNote source={outfit.source_type} />
                <h2>{outfit.title}</h2>
                <p className={styles.muted}>{outfit.rationale}</p>
                <StudioLink
                  href={`/capsules/${capsule.id}/outfits/${outfit.id}`}
                  secondary
                >
                  Open combination
                </StudioLink>
              </article>
            ))
          ) : (
            <section className={styles.panel}>
              <h2>Room for a new combination.</h2>
              <p className={`${styles.muted} mt-4`}>
                Save an AI suggestion, or arrange your own pieces. Saved
                combinations will be here when you return.
              </p>
            </section>
          )}
        </section>
        <aside className={styles.stack}>
          <section className={styles.panel}>
            <h2>Make it your own.</h2>
            <p className={`${styles.muted} mt-3`}>{capsule.brief.purpose}</p>
            <div className={styles.constraints}>
              {available.map((item) => (
                <label className={styles.constraint} key={item.id}>
                  <span>{item.name}</span>
                  <select
                    aria-label={`Use of ${item.name}`}
                    value={constraints[item.id] ?? "any"}
                    disabled={busy !== null}
                    onChange={(event) => {
                      setConstraints((previous) => ({
                        ...previous,
                        [item.id]: event.target.value,
                      }));
                      setSuggestions([]);
                    }}
                  >
                    <option value="any">Optional</option>
                    <option value="required">Always include</option>
                    <option value="excluded">Leave out</option>
                  </select>
                </label>
              ))}
            </div>
            <label className={`${styles.field} mt-6`}>
              Number of suggestions
              <select
                value={count}
                onChange={(event) => {
                  setCount(Number(event.target.value));
                  setSuggestions([]);
                }}
                disabled={busy !== null}
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            {!capabilities.textAi ? (
              <p className={`${styles.notice} mt-6`}>
                AI outfit suggestions are currently unavailable. You can still
                arrange your own owned pieces.
              </p>
            ) : null}
            <div className="mt-6">
              <Button
                onClick={generate}
                loading={busy === "generate"}
                disabled={
                  !capabilities.textAi || busy !== null || !available.length
                }
              >
                Suggest combinations
              </Button>
            </div>
          </section>
          <section className={styles.panel}>
            <h2>Have a combination in mind?</h2>
            <p className={`${styles.muted} my-4`}>
              Choose the pieces yourself and save a styling note.
            </p>
            <Button
              variant="secondary"
              onClick={() => setManual(!manual)}
              aria-expanded={manual}
            >
              Arrange your own
            </Button>
            {manual ? (
              <form
                className={`${styles.form} mt-6`}
                onSubmit={(event) => {
                  event.preventDefault();
                  void save(
                    { title, rationale, item_ids: manualIds, uncertainty: "" },
                    "manual",
                    "manual",
                  );
                }}
              >
                <Input
                  label="Combination name"
                  required
                  maxLength={160}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
                <fieldset>
                  <legend>Owned pieces</legend>
                  {available.map((item) => (
                    <label className={styles.consent} key={item.id}>
                      <input
                        type="checkbox"
                        checked={manualIds.includes(item.id)}
                        onChange={(event) =>
                          setManualIds((previous) =>
                            event.target.checked
                              ? [...previous, item.id]
                              : previous.filter((id) => id !== item.id),
                          )
                        }
                      />
                      {item.name}
                    </label>
                  ))}
                </fieldset>
                <Textarea
                  label="Your styling note"
                  required
                  maxLength={4000}
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                />
                <Button
                  type="submit"
                  disabled={
                    !capabilities.writes || !manualIds.length || busy !== null
                  }
                  loading={busy === "manual"}
                >
                  Save combination
                </Button>
              </form>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
