"use client";

import { useState } from "react";
import { useForm, useWatch, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Textarea } from "@/components/arc/textarea/textarea";
import { createCapsuleSchema } from "../schema";
import { studioRequest, requestMessage } from "../api-client";
import type { CapsuleDetail, StudioItem } from "../types";
import { ItemVisual, StudioError } from "./studio-ui";
import styles from "./studio.module.css";
import { useClientReady } from "@/lib/use-client-ready";

type FormInput = z.input<typeof createCapsuleSchema>;
type FormOutput = z.output<typeof createCapsuleSchema>;

export function CapsuleForm({
  inventory,
  capsule,
  initialIds = [],
  initialTitle = "",
  onCancel,
  writes,
}: {
  inventory: StudioItem[];
  capsule?: CapsuleDetail;
  initialIds?: string[];
  initialTitle?: string;
  onCancel?: () => void;
  writes: boolean;
}) {
  const router = useRouter();
  const ready = useClientReady();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCapsuleSchema),
    defaultValues: {
      title: capsule?.title ?? initialTitle,
      description: capsule?.description ?? "",
      brief: capsule?.brief ?? {
        purpose: "",
        notes: "",
        style_preferences: "",
        fit_preferences: "",
        color_preferences: "",
        avoid: "",
      },
      timeframe: capsule?.timeframe ?? "",
      occasion: capsule?.occasion ?? "",
      season: capsule?.season ?? "",
      item_ids:
        capsule?.items
          .filter((item) => item.available)
          .map((item) => item.id) ?? initialIds,
    },
    mode: "onBlur",
  });
  const selectedIds = useWatch({ control, name: "item_ids" }) ?? [];
  const { field: selection } = useController({ control, name: "item_ids" });
  const selected = new Set(selectedIds);
  const available = inventory.filter((item) => item.available);
  const categories = [
    ...new Set(available.map((item) => item.category)),
  ].sort();
  const filtered = available.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      `${item.name} ${item.color} ${item.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  async function save(values: FormOutput) {
    setError("");
    try {
      const result = await studioRequest<{ id: string }>(
        capsule ? `/api/capsules/${capsule.id}` : "/api/capsules",
        {
          method: capsule ? "PATCH" : "POST",
          body: JSON.stringify({
            ...values,
            ...(capsule ? { expected_revision: capsule.revision } : {}),
          }),
        },
      );
      router.push(`/capsules/${result.id}`);
      router.refresh();
    } catch (failure) {
      setError(requestMessage(failure));
    }
  }

  return (
    <form onSubmit={handleSubmit(save)} className={styles.form} noValidate>
      {error ? <StudioError message={error} /> : null}
      {!writes ? (
        <p className={styles.notice}>
          Editing is currently unavailable. Your wardrobe and saved capsules are
          still available to browse.
        </p>
      ) : null}
      <fieldset className={styles.panel} disabled={isSubmitting || !ready}>
        <legend>Your personal brief</legend>
        <div className={styles.fields}>
          <div className={styles.wide}>
            <Input
              label="Capsule name"
              placeholder="Give this collection a name"
              maxLength={120}
              error={errors.title?.message}
              {...register("title")}
            />
          </div>
          <div className={styles.wide}>
            <Input
              label="What are you dressing for?"
              placeholder="Workdays, a trip, or a change of season"
              maxLength={240}
              error={errors.brief?.purpose?.message}
              {...register("brief.purpose")}
            />
          </div>
          <Input
            label="Timeframe (optional)"
            placeholder="For example, five workdays"
            maxLength={120}
            {...register("timeframe")}
          />
          <Input
            label="Occasion (optional)"
            placeholder="Everyday, work, evenings…"
            maxLength={120}
            {...register("occasion")}
          />
          <Input
            label="Season or climate (optional)"
            maxLength={120}
            placeholder="Cool mornings, warm afternoons…"
            {...register("season")}
          />
          <Input
            label="Style direction (optional)"
            maxLength={300}
            placeholder="The mood you want to keep"
            {...register("brief.style_preferences")}
          />
          <Input
            label="Fit and coverage (optional)"
            maxLength={300}
            placeholder="Your preferred shapes and comfort"
            {...register("brief.fit_preferences")}
          />
          <Input
            label="Color preferences (optional)"
            maxLength={300}
            placeholder="Colors you enjoy wearing"
            {...register("brief.color_preferences")}
          />
          <div className={styles.wide}>
            <Textarea
              label="Anything to avoid? (optional)"
              maxLength={300}
              rows={2}
              {...register("brief.avoid")}
            />
          </div>
          <div className={styles.wide}>
            <Textarea
              label="Anything else the stylist should know? (optional)"
              maxLength={1000}
              rows={3}
              description="Activities, layering, practical needs, or pieces you want to make more use of."
              error={errors.brief?.notes?.message}
              {...register("brief.notes")}
            />
          </div>
          <div className={styles.wide}>
            <Textarea
              label="Collection note (optional)"
              maxLength={4000}
              rows={2}
              {...register("description")}
            />
          </div>
        </div>
      </fieldset>
      <fieldset className={styles.panel} disabled={isSubmitting || !ready}>
        <legend>Start with what you own</legend>
        <p className={styles.muted}>
          Choose the pieces to include. AI will use only this selection.
        </p>
        <div className={styles.sectionTitle}>
          <span className={styles.pill} role="status">
            {selected.size} selected
          </span>
          <label className={styles.field}>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All pieces</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.field}>
          Search your wardrobe
          <input
            className={styles.search}
            type="search"
            placeholder="Name, color, or category"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {errors.item_ids ? (
          <p className={styles.fieldError} role="alert">
            Choose at least one owned piece, with each piece selected once.
          </p>
        ) : null}
        <div className={styles.selector}>
          {filtered.map((item) => (
            <label
              className={styles.selectItem}
              key={item.id}
              data-selected={selected.has(item.id)}
            >
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={(event) =>
                  selection.onChange(
                    event.target.checked
                      ? [...selectedIds, item.id]
                      : selectedIds.filter((id) => id !== item.id),
                  )
                }
                aria-label={`Include ${item.name}`}
              />
              <ItemVisual item={item} />
              <div className={styles.itemCopy}>
                <h3>{item.name}</h3>
                <p>
                  {item.color} · {item.category}
                </p>
              </div>
            </label>
          ))}
        </div>
        {!available.length ? (
          <p className={styles.muted}>
            Add owned pieces to your wardrobe before building a capsule.{" "}
            <Link className={styles.textLink} href="/wardrobe">
              Open wardrobe
            </Link>
          </p>
        ) : !filtered.length ? (
          <p className={styles.muted}>
            No pieces match this search. Try another color or name.
          </p>
        ) : null}
        {capsule?.items.some((item) => !item.available) ? (
          <p className={styles.notice}>
            Unavailable pieces have been left out of this selection. If a saved
            combination still uses one, remove that combination before saving.
          </p>
        ) : null}
      </fieldset>
      <div className={styles.actions}>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!writes || !available.length}
        >
          {capsule ? "Save changes" : "Build capsule"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Link
            className={styles.secondaryLink}
            href={capsule ? `/capsules/${capsule.id}` : "/capsules"}
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
