"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { ImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/arc/dialog/dialog";
import {
  editWardrobeItem,
  removeWardrobeImage,
  removeWardrobeItem,
  type WardrobeActionState,
} from "../actions";
import { categories } from "../schema";
import type { WardrobeItem } from "../repository";
import {
  preparedWardrobeUpload,
  responseCode,
  uploadWardrobeFile,
} from "./image-upload-client";

const inputClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";
const initialState: WardrobeActionState = { ok: false, message: "" };
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 10 * 1024 * 1024;

type UploadState = {
  pending: boolean;
  progress: number | null;
  message: string;
  error: boolean;
};

const idleUpload: UploadState = {
  pending: false,
  progress: null,
  message: "",
  error: false,
};

function Status({ state }: { state: WardrobeActionState }) {
  return (
    <p role="status" aria-live="polite" className="text-secondary text-sm">
      {state.message}
    </p>
  );
}

function prepareError(code: string) {
  if (code === "DEMO_WRITES_DISABLED")
    return "Saving is disabled for this shared demo.";
  if (code === "WARDROBE_ITEM_NOT_FOUND")
    return "This wardrobe item is no longer available. Refresh and try again.";
  return "The upload could not be prepared. Please try again.";
}

export function WardrobeItemControls({
  item,
  imageUrl,
  enabled,
}: {
  item: WardrobeItem;
  imageUrl: ImageProps["src"] | null;
  enabled: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editState, editAction, editPending] = useActionState(
    editWardrobeItem,
    initialState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    removeWardrobeItem,
    initialState,
  );
  const [imageState, imageAction, imagePending] = useActionState(
    removeWardrobeImage,
    initialState,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [upload, setUpload] = useState(idleUpload);

  useEffect(() => {
    if (editState.ok || archiveState.ok || imageState.ok) {
      router.refresh();
    }
  }, [archiveState.ok, editState.ok, imageState.ok, router]);

  async function handleImageUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setUpload({
        pending: false,
        progress: null,
        message: "Choose an image file to upload.",
        error: true,
      });
      return;
    }
    if (
      !allowedImageTypes.has(file.type) ||
      file.size < 1 ||
      file.size > maxImageBytes
    ) {
      setUpload({
        pending: false,
        progress: null,
        message: "Choose a JPEG, PNG, or WebP image up to 10 MiB.",
        error: true,
      });
      return;
    }
    if (!enabled) {
      setUpload({
        pending: false,
        progress: null,
        message: "Saving is disabled for this shared demo.",
        error: true,
      });
      return;
    }

    setUpload({
      pending: true,
      progress: null,
      message: "Preparing upload…",
      error: false,
    });
    try {
      const prepareResponse = await fetch(
        `/api/wardrobe/${encodeURIComponent(item.id)}/image-uploads`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mimeType: file.type, byteSize: file.size }),
        },
      );
      const preparePayload: unknown = await prepareResponse
        .json()
        .catch(() => null);
      const prepared = preparedWardrobeUpload(preparePayload);
      if (!prepareResponse.ok || !prepared) {
        setUpload({
          pending: false,
          progress: null,
          message: prepareError(responseCode(preparePayload)),
          error: true,
        });
        return;
      }

      setUpload({
        pending: true,
        progress: 0,
        message: "Uploading image…",
        error: false,
      });
      await uploadWardrobeFile(prepared.uploadUrl, file, (progress) => {
        setUpload({
          pending: true,
          progress,
          message: "Uploading image…",
          error: false,
        });
      });

      setUpload({
        pending: true,
        progress: 100,
        message: "Finishing upload…",
        error: false,
      });
      const finalizeResponse = await fetch(
        `/api/wardrobe/${encodeURIComponent(item.id)}/image-uploads/${encodeURIComponent(prepared.assetId)}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedAssetId: prepared.expectedAssetId }),
        },
      );
      const finalizePayload: unknown = await finalizeResponse
        .json()
        .catch(() => null);
      if (!finalizeResponse.ok) {
        const conflict =
          responseCode(finalizePayload) === "WARDROBE_IMAGE_CONFLICT";
        setUpload({
          pending: false,
          progress: null,
          message: conflict
            ? "This image changed while you were uploading. The latest wardrobe image has been restored; choose the file again to retry."
            : "The image could not be finalized. The current image was kept; choose the file again to retry.",
          error: true,
        });
        router.refresh();
        return;
      }

      setUpload({
        pending: false,
        progress: null,
        message: "Image uploaded.",
        error: false,
      });
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch {
      setUpload({
        pending: false,
        progress: null,
        message:
          "The image could not be uploaded. The current image was kept; choose the file again to retry.",
        error: true,
      });
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (upload.pending) return;
          setDialogOpen(open);
          if (!open) setConfirmArchive(false);
        }}
      >
        <DialogTrigger asChild>
          <Button
            type="button"
            className="border-border bg-background text-foreground hover:bg-muted min-h-11 border"
          >
            Edit item
          </Button>
        </DialogTrigger>
        <DialogContent
          title={confirmArchive ? "Archive this item?" : item.name}
          description={
            confirmArchive
              ? "It will leave the active wardrobe while saved-look references are kept."
              : "Update the details or image for this wardrobe piece."
          }
          className="!inset-y-0 !right-0 !left-auto !m-0 !h-dvh !max-h-dvh !w-full !max-w-none !rounded-none sm:!w-[min(32rem,calc(100vw-2rem))] sm:!rounded-l-2xl [&>div:first-child>button]:!h-11 [&>div:first-child>button]:!w-11"
        >
          {confirmArchive ? (
            <form action={archiveAction} className="space-y-4">
              <input type="hidden" name="id" value={item.id} />
              <p className="text-secondary">
                This removes the item from active wardrobe results. Its
                saved-look references remain available.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!enabled || archivePending}>
                  {archivePending ? "Archiving…" : "Archive item"}
                </Button>
                <Button
                  type="button"
                  className="border-border bg-background text-foreground hover:bg-muted border"
                  disabled={archivePending}
                  onClick={() => setConfirmArchive(false)}
                >
                  Keep item
                </Button>
              </div>
              <Status state={archiveState} />
            </form>
          ) : (
            <div className="space-y-7">
              <form action={editAction} className="space-y-4">
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="attributes"
                  value={JSON.stringify(item.attributes)}
                />
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

              <form onSubmit={handleImageUpload} className="space-y-3">
                <label className="block text-sm">
                  Garment image
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    disabled={!enabled || upload.pending}
                    aria-describedby={`wardrobe-image-help-${item.id}`}
                    className={`${inputClass} file:bg-primary file:text-primary-foreground file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1`}
                  />
                </label>
                <p
                  id={`wardrobe-image-help-${item.id}`}
                  className="text-secondary text-xs"
                >
                  JPEG, PNG, or WebP up to 10 MiB.
                </p>
                <Button type="submit" disabled={!enabled || upload.pending}>
                  {upload.pending
                    ? upload.progress === null
                      ? "Preparing upload…"
                      : "Uploading…"
                    : imageUrl
                      ? "Replace image"
                      : "Upload image"}
                </Button>
                {upload.progress !== null && (
                  <div className="space-y-1">
                    <progress
                      aria-label="Image upload progress"
                      value={upload.progress}
                      max={100}
                      className="accent-primary h-2 w-full"
                    />
                    <p className="text-secondary text-xs" aria-hidden="true">
                      {upload.progress}%
                    </p>
                  </div>
                )}
                {upload.message && (
                  <p
                    role={upload.error ? "alert" : "status"}
                    aria-live={upload.error ? "assertive" : "polite"}
                    className={`text-sm ${upload.error ? "text-primary" : "text-secondary"}`}
                  >
                    {upload.message}
                  </p>
                )}
              </form>

              {item.asset_id && (
                <form action={imageAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button
                    type="submit"
                    className="border-border bg-background text-foreground hover:bg-muted border"
                    disabled={!enabled || imagePending}
                  >
                    {imagePending ? "Removing image…" : "Remove image"}
                  </Button>
                  <Status state={imageState} />
                </form>
              )}

              <div className="border-border border-t pt-5">
                <button
                  type="button"
                  disabled={!enabled || archivePending || upload.pending}
                  onClick={() => setConfirmArchive(true)}
                  className="text-secondary min-h-11 rounded-full px-4 text-sm underline underline-offset-4 disabled:opacity-50"
                >
                  Archive item
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Link
        href={`/wardrobe/${item.id}/preview`}
        className="border-border bg-background text-foreground hover:bg-card inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium"
      >
        Preview
      </Link>
    </div>
  );
}
