"use client";

import { useState, useActionState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { savePreferences } from "../actions";
import type { PreferencesInput } from "../schema";

const fieldClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";
const choiceClass =
  "border-border bg-background hover:border-primary focus-visible:border-primary focus-visible:ring-primary min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:outline-none";

function ToggleChoices({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const choices = [...new Set([...options, ...value])];
  function toggle(item: string) {
    onChange(
      value.includes(item)
        ? value.filter((entry) => entry !== item)
        : [...value, item],
    );
  }
  function addCustom() {
    const item = custom.trim().slice(0, 48);
    if (item && !value.includes(item) && value.length < 20)
      onChange([...value, item]);
    setCustom("");
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {choices.map((item) => {
          const selected = value.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(item)}
              className={`${choiceClass} ${selected ? "border-primary bg-primary/10 text-primary" : "text-secondary"}`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="flex max-w-md gap-2">
        <label
          className="sr-only"
          htmlFor={`custom-${label.replaceAll(" ", "-")}`}
        >
          Add a custom {label.toLowerCase()} choice
        </label>
        <input
          id={`custom-${label.replaceAll(" ", "-")}`}
          className={fieldClass}
          value={custom}
          maxLength={48}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder={`Add your own ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={addCustom}
          className="text-primary min-h-11 shrink-0 px-3 text-sm font-medium"
          disabled={!custom.trim()}
        >
          Add
        </button>
      </div>
    </fieldset>
  );
}

function SingleChoices({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const selectedOption = options.some((option) => option.value === value);
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange("")}
          className={`${choiceClass} ${!value ? "border-primary bg-primary/10 text-primary" : "text-secondary"}`}
        >
          Skip
        </button>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`${choiceClass} ${selected ? "border-primary bg-primary/10 text-primary" : "text-secondary"}`}
            >
              {option.label}
            </button>
          );
        })}
        {value && !selectedOption && (
          <button
            type="button"
            aria-pressed="true"
            onClick={() => onChange("")}
            className={`${choiceClass} border-primary bg-primary/10 text-primary`}
          >
            Saved choice: {value}
          </button>
        )}
      </div>
    </fieldset>
  );
}

const initialList = (value?: string[]) => value ?? [];

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
    initialList(initialValue.style_dna.style_tags),
  );
  const [colors, setColors] = useState(
    initialList(initialValue.style_dna.preferred_color_families),
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
    initialList(initialValue.fit_preferences.preferred_fit),
  );
  const [coverage, setCoverage] = useState(
    initialList(initialValue.fit_preferences.coverage),
  );
  const [lengths, setLengths] = useState(
    initialList(initialValue.fit_preferences.preferred_lengths),
  );
  const [layering, setLayering] = useState(
    initialList(initialValue.fit_preferences.layering),
  );
  const [bodyShape, setBodyShape] = useState(
    initialValue.body_profile.body_shape ?? "",
  );
  const [proportions, setProportions] = useState(
    initialValue.body_profile.proportions ?? "",
  );
  const [illustration, setIllustration] = useState(
    initialValue.body_profile.illustration ?? "",
  );

  const styleDna = {
    ...(styleTags.length ? { style_tags: styleTags } : {}),
    ...(colors.length ? { preferred_color_families: colors } : {}),
    ...(contrast ? { contrast_level: contrast } : {}),
    ...(undertone ? { undertone } : {}),
    ...(skinDepth ? { skin_depth: skinDepth } : {}),
  };
  const fitPreferences = {
    ...(fit.length ? { preferred_fit: fit } : {}),
    ...(coverage.length ? { coverage } : {}),
    ...(lengths.length ? { preferred_lengths: lengths } : {}),
    ...(layering.length ? { layering } : {}),
  };
  const bodyProfile = {
    ...(bodyShape.trim() ? { body_shape: bodyShape.trim() } : {}),
    ...(proportions.trim() ? { proportions: proportions.trim() } : {}),
    ...(illustration.trim() ? { illustration: illustration.trim() } : {}),
  };

  function clearAll() {
    setStyleTags([]);
    setColors([]);
    setContrast("");
    setUndertone("");
    setSkinDepth("");
    setFit([]);
    setCoverage([]);
    setLengths([]);
    setLayering([]);
    setBodyShape("");
    setProportions("");
    setIllustration("");
  }

  return (
    <form
      action={action}
      className="border-border bg-card space-y-10 rounded-2xl border p-5 sm:p-7"
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

      <section className="space-y-6" aria-labelledby="style-dna-heading">
        <div>
          <h2 id="style-dna-heading" className="font-serif text-2xl">
            Style DNA
          </h2>
          <p className="text-secondary mt-1 text-sm">
            Choose any that feel useful. Every choice is optional.
          </p>
        </div>
        <ToggleChoices
          label="Style tags"
          options={[
            "Minimalist",
            "Streetwear",
            "Classic",
            "Romantic",
            "Sporty",
            "Workwear",
            "Modest",
            "Experimental",
          ]}
          value={styleTags}
          onChange={setStyleTags}
        />
        <ToggleChoices
          label="Preferred color families"
          options={[
            "Neutrals",
            "Earth tones",
            "Monochrome",
            "Pastels",
            "Jewel tones",
            "Bright colors",
          ]}
          value={colors}
          onChange={setColors}
        />
        <div className="grid gap-6 md:grid-cols-2">
          <SingleChoices
            label="Contrast level"
            value={contrast}
            onChange={setContrast}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
              { value: "unsure", label: "Unsure" },
            ]}
          />
          <SingleChoices
            label="Undertone reference"
            value={undertone}
            onChange={setUndertone}
            options={[
              { value: "warm", label: "Warm" },
              { value: "cool", label: "Cool" },
              { value: "neutral", label: "Neutral" },
              { value: "unsure", label: "Unsure" },
            ]}
          />
          <SingleChoices
            label="Optional skin-depth reference"
            value={skinDepth}
            onChange={setSkinDepth}
            options={[
              { value: "very_light", label: "Very light" },
              { value: "light", label: "Light" },
              { value: "light_medium", label: "Light medium" },
              { value: "medium", label: "Medium" },
              { value: "medium_deep", label: "Medium deep" },
              { value: "deep", label: "Deep" },
              { value: "unsure", label: "Unsure" },
            ]}
          />
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="fit-heading">
        <div>
          <h2 id="fit-heading" className="font-serif text-2xl">
            Fit and coverage
          </h2>
          <p className="text-secondary mt-1 text-sm">
            Select more than one, or leave everything blank.
          </p>
        </div>
        <ToggleChoices
          label="Preferred fit"
          options={["Relaxed", "Regular", "Fitted", "Oversized"]}
          value={fit}
          onChange={setFit}
        />
        <ToggleChoices
          label="Coverage"
          options={[
            "Higher neckline",
            "Longer sleeves",
            "More coverage",
            "Open neckline",
            "Sleeveless",
          ]}
          value={coverage}
          onChange={setCoverage}
        />
        <ToggleChoices
          label="Preferred lengths"
          options={[
            "Cropped",
            "Waist length",
            "Hip length",
            "Midi",
            "Full length",
          ]}
          value={lengths}
          onChange={setLengths}
        />
        <ToggleChoices
          label="Layering"
          options={[
            "Light layers",
            "Layer-friendly",
            "Minimal layers",
            "Layered outfits",
          ]}
          value={layering}
          onChange={setLayering}
        />
      </section>

      <section className="space-y-5" aria-labelledby="body-profile-heading">
        <div>
          <h2 id="body-profile-heading" className="font-serif text-2xl">
            Body-profile reference
          </h2>
          <p className="text-secondary mt-1 text-sm">
            Optional and self-selected. Nothing is inferred from photos; these
            preferences are shared with demo visitors.
          </p>
        </div>
        <SingleChoices
          label="Body-shape reference"
          value={bodyShape}
          onChange={(value) => {
            setBodyShape(value);
            setIllustration(value);
          }}
          options={[
            { value: "balanced", label: "Balanced" },
            { value: "shoulder-forward", label: "Shoulder-forward" },
            { value: "hip-forward", label: "Hip-forward" },
            { value: "defined-waist", label: "Defined waist" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Proportions reference
            <input
              className={fieldClass}
              value={proportions}
              maxLength={80}
              onChange={(event) => setProportions(event.target.value)}
              placeholder="Optional, self-described"
            />
          </label>
          <label className="block text-sm">
            Illustration choice
            <input
              className={fieldClass}
              value={illustration}
              maxLength={80}
              onChange={(event) => setIllustration(event.target.value)}
              placeholder="Optional style reference"
            />
          </label>
        </div>
      </section>

      <div className="border-border flex flex-wrap items-center gap-3 border-t pt-5">
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
