"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  editWardrobeItem,
  removeWardrobeImage,
  removeWardrobeItem,
  uploadWardrobeImage,
  type WardrobeActionState,
} from "../actions";
import { categories } from "../schema";
import type { WardrobeItem } from "../repository";

const inputClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";
const initialState: WardrobeActionState = { ok: false, message: "" };

function Status({ state }: { state: WardrobeActionState }) {
  return (
    <p role="status" aria-live="polite" className="text-secondary text-sm">
      {state.message}
    </p>
  );
}

export function WardrobeItemControls({
  item,
  imageUrl,
  enabled,
}: {
  item: WardrobeItem;
  imageUrl: string | null;
  enabled: boolean;
}) {
  const [editState, editAction, editPending] = useActionState(
    editWardrobeItem,
    initialState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    removeWardrobeItem,
    initialState,
  );
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadWardrobeImage,
    initialState,
  );
  const [imageState, imageAction, imagePending] = useActionState(
    removeWardrobeImage,
    initialState,
  );

  return (
    <div className="border-border mt-6 space-y-5 border-t pt-5">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={item.name}
          width={1200}
          height={800}
          unoptimized
          className="bg-background max-h-64 w-full rounded-xl object-contain"
        />
      )}

      <form action={editAction} className="space-y-3">
        <input type="hidden" name="id" value={item.id} />
        <input
          type="hidden"
          name="attributes"
          value={JSON.stringify(item.attributes)}
        />
        <h3 className="text-sm font-semibold">Edit item details</h3>
        <label className="block text-sm">
          Name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={item.name}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Category
          <select
            name="category"
            defaultValue={item.category}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Color
          <input
            name="color"
            required
            maxLength={40}
            defaultValue={item.color}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Subcategory
          <input
            name="subcategory"
            maxLength={120}
            defaultValue={item.subcategory ?? ""}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Notes
          <textarea
            name="notes"
            maxLength={4000}
            defaultValue={item.notes}
            className={`${inputClass} min-h-24`}
          />
        </label>
        <Button type="submit" disabled={!enabled || editPending}>
          {editPending ? "Saving…" : "Save changes"}
        </Button>
        <Status state={editState} />
      </form>

      <form action={uploadAction} className="space-y-3">
        <input type="hidden" name="id" value={item.id} />
        <label className="block text-sm">
          Garment image
          <input
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className={`${inputClass} file:bg-primary file:text-primary-foreground file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1`}
          />
        </label>
        <Button type="submit" disabled={!enabled || uploadPending}>
          {uploadPending
            ? "Uploading…"
            : imageUrl
              ? "Replace image"
              : "Upload image"}
        </Button>
        <Status state={uploadState} />
      </form>

      {item.asset_id && (
        <form action={imageAction}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            disabled={!enabled || imagePending}
            className="text-secondary min-h-11 rounded-full px-4 text-sm underline underline-offset-4 disabled:opacity-50"
          >
            {imagePending ? "Removing…" : "Remove image"}
          </button>
          <Status state={imageState} />
        </form>
      )}

      <form action={archiveAction}>
        <input type="hidden" name="id" value={item.id} />
        <button
          type="submit"
          disabled={!enabled || archivePending}
          className="text-secondary min-h-11 rounded-full px-4 text-sm underline underline-offset-4 disabled:opacity-50"
        >
          {archivePending ? "Archiving…" : "Archive item"}
        </button>
        <p className="text-secondary text-xs">
          Archiving hides the item from the active wardrobe and keeps its
          saved-look references.
        </p>
        <Status state={archiveState} />
      </form>
    </div>
  );
}
