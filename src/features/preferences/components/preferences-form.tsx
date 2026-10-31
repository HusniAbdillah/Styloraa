"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { savePreferences } from "../actions";
import type { PreferencesInput } from "../schema";

const fieldClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";

function listText(value?: string[]) {
  return value?.join(", ") ?? "";
}

function toList(value: string) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export function PreferencesForm({
  initialValue,
  enabled,
}: {
  initialValue: PreferencesInput;
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(savePreferences, {
    ok: false,
    message: "",
  });
  const [styleTags, setStyleTags] = useState(
    listText(initialValue.style_dna.style_tags),
  );
  const [colorFamilies, setColorFamilies] = useState(
    listText(initialValue.style_dna.preferred_color_families),
  );
  const [contrast, setContrast] = useState(
    initialValue.style_dna.contrast_level ?? "",
  );
  const [undertone, setUndertone] = useState(
    initialValue.style_dna.undertone ?? "",
  );
  const [skinDepth, setSkinDepth] = useState(
    initialValue.style_dna.skin_depth ?? "",
  );
  const [fit, setFit] = useState(
    listText(initialValue.fit_preferences.preferred_fit),
  );
  const [coverage, setCoverage] = useState(
    listText(initialValue.fit_preferences.coverage),
  );
  const [lengths, setLengths] = useState(
    listText(initialValue.fit_preferences.preferred_lengths),
  );
  const [layering, setLayering] = useState(
    listText(initialValue.fit_preferences.layering),
  );
  const [proportions, setProportions] = useState(
    initialValue.body_profile.proportions ?? "",
  );
  const [bodyShape, setBodyShape] = useState(
    initialValue.body_profile.body_shape ?? "",
  );
  const [illustration, setIllustration] = useState(
    initialValue.body_profile.illustration ?? "",
  );

  const styleDna = {
    ...(toList(styleTags) ? { style_tags: toList(styleTags) } : {}),
    ...(toList(colorFamilies)
      ? { preferred_color_families: toList(colorFamilies) }
      : {}),
    ...(contrast ? { contrast_level: contrast } : {}),
    ...(undertone ? { undertone } : {}),
    ...(skinDepth ? { skin_depth: skinDepth } : {}),
  };
  const fitPreferences = {
    ...(toList(fit) ? { preferred_fit: toList(fit) } : {}),
    ...(toList(coverage) ? { coverage: toList(coverage) } : {}),
    ...(toList(lengths) ? { preferred_lengths: toList(lengths) } : {}),
    ...(toList(layering) ? { layering: toList(layering) } : {}),
  };
  const bodyProfile = {
    ...(bodyShape.trim() ? { body_shape: bodyShape.trim() } : {}),
    ...(proportions.trim() ? { proportions: proportions.trim() } : {}),
    ...(illustration.trim() ? { illustration: illustration.trim() } : {}),
  };

  function clearAll() {
    setStyleTags("");
    setColorFamilies("");
    setContrast("");
    setUndertone("");
    setSkinDepth("");
    setFit("");
    setCoverage("");
    setLengths("");
    setLayering("");
    setBodyShape("");
    setProportions("");
    setIllustration("");
  }

  return (
    <form
      action={action}
      className="border-border bg-card space-y-8 rounded-2xl border p-6"
    >
      <input type="hidden" name="style_dna" value={JSON.stringify(styleDna)} />
      <input
        type="hidden"
        name="fit_preferences"
        value={JSON.stringify(fitPreferences)}
      />
      <input
        type="hidden"
        name="body_profile"
        value={JSON.stringify(bodyProfile)}
      />

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">Style DNA</h2>
          <p className="text-secondary mt-1 text-sm">
            Optional style and color references.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Style tags <span className="text-secondary">(comma separated)</span>
            <input
              className={fieldClass}
              value={styleTags}
              maxLength={800}
              onChange={(event) => setStyleTags(event.target.value)}
              placeholder="minimalist, classic"
            />
          </label>
          <label className="block text-sm">
            Preferred color families
            <input
              className={fieldClass}
              value={colorFamilies}
              maxLength={800}
              onChange={(event) => setColorFamilies(event.target.value)}
              placeholder="neutrals, earth tones"
            />
          </label>
          <label className="block text-sm">
            Contrast level
            <select
              className={fieldClass}
              value={contrast}
              onChange={(event) => setContrast(event.target.value)}
            >
              <option value="">Skip</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
          <label className="block text-sm">
            Undertone reference
            <select
              className={fieldClass}
              value={undertone}
              onChange={(event) => setUndertone(event.target.value)}
            >
              <option value="">Skip</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
              <option value="neutral">Neutral</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
          <label className="block text-sm">
            Optional skin-depth reference
            <select
              className={fieldClass}
              value={skinDepth}
              onChange={(event) => setSkinDepth(event.target.value)}
            >
              <option value="">Skip</option>
              <option value="very_light">Very light</option>
              <option value="light">Light</option>
              <option value="light_medium">Light medium</option>
              <option value="medium">Medium</option>
              <option value="medium_deep">Medium deep</option>
              <option value="deep">Deep</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">Fit and coverage</h2>
          <p className="text-secondary mt-1 text-sm">
            All preferences can be skipped or cleared.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Preferred fit{" "}
            <span className="text-secondary">(comma separated)</span>
            <input
              className={fieldClass}
              value={fit}
              maxLength={800}
              onChange={(event) => setFit(event.target.value)}
              placeholder="relaxed, regular"
            />
          </label>
          <label className="block text-sm">
            Coverage
            <input
              className={fieldClass}
              value={coverage}
              maxLength={800}
              onChange={(event) => setCoverage(event.target.value)}
              placeholder="higher neckline, longer sleeves"
            />
          </label>
          <label className="block text-sm">
            Preferred lengths
            <input
              className={fieldClass}
              value={lengths}
              maxLength={800}
              onChange={(event) => setLengths(event.target.value)}
              placeholder="cropped, full length"
            />
          </label>
          <label className="block text-sm">
            Layering preferences
            <input
              className={fieldClass}
              value={layering}
              maxLength={800}
              onChange={(event) => setLayering(event.target.value)}
              placeholder="light layers"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl">Body-profile reference</h2>
          <p className="text-secondary mt-1 text-sm">
            Optional self-selected references. Nothing is inferred from photos.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Body-shape reference
            <input
              className={fieldClass}
              value={bodyShape}
              maxLength={80}
              onChange={(event) => setBodyShape(event.target.value)}
              placeholder="Optional self-selected reference"
            />
          </label>
          <label className="block text-sm">
            Proportions reference
            <input
              className={fieldClass}
              value={proportions}
              maxLength={80}
              onChange={(event) => setProportions(event.target.value)}
              placeholder="Optional text reference"
            />
          </label>
          <label className="block text-sm">
            Illustration choice
            <input
              className={fieldClass}
              value={illustration}
              maxLength={80}
              onChange={(event) => setIllustration(event.target.value)}
              placeholder="Optional illustration label"
            />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!enabled || pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
        <button
          type="button"
          onClick={clearAll}
          disabled={!enabled || pending}
          className="text-secondary min-h-11 rounded-full px-4 text-sm underline underline-offset-4 disabled:opacity-50"
        >
          Clear all
        </button>
        <p role="status" aria-live="polite" className="text-secondary text-sm">
          {state.message ||
            (!enabled
              ? "Connect Supabase and enable demo writes to save."
              : "")}
        </p>
      </div>
    </form>
  );
}
