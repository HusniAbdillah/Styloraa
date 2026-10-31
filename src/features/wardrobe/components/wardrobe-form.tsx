"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { addWardrobeItem, type WardrobeActionState } from "../actions";
import { categories, wardrobeImageMetadataSchema } from "../schema";
import {
  preparedWardrobeUpload,
  responseCode,
  uploadWardrobeFile,
} from "./image-upload-client";

const inputClass =
  "border-border bg-background focus:border-primary mt-2 block min-h-11 w-full rounded-xl border px-3 py-2 focus:outline-none";
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const emptyActionState: WardrobeActionState = { ok: false, message: "" };

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

function uploadError(code: string, status: number) {
  if (code === "DEMO_WRITES_DISABLED")
    return "Saving is disabled for this shared demo.";
  if (code === "DATABASE_NOT_CONFIGURED")
    return "Connect Supabase before uploading a photo.";
  if (status === 404)
    return "The upload service route is unavailable. Restart the app and try again.";
  if (code === "UPLOAD_ASSET_RECORD_FAILED")
    return "Supabase could not save the upload record. Check the server key and wardrobe database migration.";
  if (code === "UPLOAD_SIGNED_URL_FAILED")
    return "Supabase could not issue a private upload URL. Check that the wardrobe bucket is active.";
  if (code === "UPLOAD_PREPARATION_FAILED")
    return "The server could not prepare a private upload. Check Supabase and the wardrobe Storage setup.";
  return "The photo upload could not be prepared. Please try again.";
}

export function WardrobeForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [actionState, setActionState] = useState(emptyActionState);
  const [upload, setUpload] = useState(idleUpload);
  const [uploadedAssetId, setUploadedAssetId] = useState("");

  function resetForm() {
    formRef.current?.reset();
    setActionState(emptyActionState);
    setUpload(idleUpload);
    setUploadedAssetId("");
  }

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      const result = await addWardrobeItem(emptyActionState, formData);
      setActionState(result);
      if (result.ok) {
        resetForm();
        setOpen(false);
        router.refresh();
      }
    });
  }

  async function handleImageUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setUpload({
        pending: false,
        progress: null,
        message: "Choose a clothing photo first.",
        error: true,
      });
      return;
    }
    const metadata = wardrobeImageMetadataSchema.safeParse({
      mimeType: file.type,
      byteSize: file.size,
    });
    if (
      !metadata.success ||
      !allowedImageTypes.has(file.type) ||
      file.size < 1
    ) {
      setUploadedAssetId("");
      setUpload({
        pending: false,
        progress: null,
        message: "Choose a JPEG, PNG, or WebP photo up to 10 MiB.",
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

    setUploadedAssetId("");
    setUpload({
      pending: true,
      progress: null,
      message: "Preparing photo upload…",
      error: false,
    });
    try {
      const prepareResponse = await fetch("/api/wardrobe/image-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata.data),
      });
      const preparePayload: unknown = await prepareResponse
        .json()
        .catch(() => null);
      const prepared = preparedWardrobeUpload(preparePayload);
      if (!prepareResponse.ok || !prepared) {
        setUpload({
          pending: false,
          progress: null,
          message: uploadError(
            responseCode(preparePayload),
            prepareResponse.status,
          ),
          error: true,
        });
        return;
      }

      setUpload({
        pending: true,
        progress: 0,
        message: "Uploading photo…",
        error: false,
      });
      await uploadWardrobeFile(prepared.uploadUrl, file, (progress) => {
        setUpload({
          pending: true,
          progress,
          message: "Uploading photo…",
          error: false,
        });
      });
      setUploadedAssetId(prepared.assetId);
      setUpload({
        pending: false,
        progress: 100,
        message: "Photo uploaded. Complete the item details and save below.",
        error: false,
      });
    } catch {
      setUpload({
        pending: false,
        progress: null,
        message: "The photo could not be uploaded. Choose it again to retry.",
        error: true,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (upload.pending || isSaving) return;
        if (!nextOpen) resetForm();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          onClick={() => resetForm()}
          aria-haspopup="dialog"
        >
          Add an item
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Add to your wardrobe"
        description="Add the details and upload a photo before saving."
        className="!inset-y-0 !right-0 !left-auto !m-0 !h-dvh !max-h-dvh !w-full !max-w-none !rounded-none sm:!w-[min(32rem,calc(100vw-2rem))] sm:!rounded-l-2xl [&>div:first-child>button]:!h-11 [&>div:first-child>button]:!w-11"
      >
        <form ref={formRef} action={handleSubmit} className="space-y-6">
          <fieldset
            disabled={!enabled || isSaving || upload.pending}
            className="space-y-5 disabled:opacity-60"
          >
            <label className="block text-sm">
              Name <span aria-hidden="true">*</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                className={inputClass}
                placeholder="Blue denim skirt"
              />
            </label>
            <label className="block text-sm">
              Category <span aria-hidden="true">*</span>
              <select
                name="category"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Color <span aria-hidden="true">*</span>
              <input
                name="color"
                required
                maxLength={40}
                className={inputClass}
                placeholder="Blue"
              />
            </label>
            <label className="block text-sm">
              Subcategory <span className="text-secondary">(optional)</span>
              <input
                name="subcategory"
                maxLength={120}
                className={inputClass}
                placeholder="Denim skirt"
              />
            </label>
            <label className="block text-sm">
              Notes <span className="text-secondary">(optional)</span>
              <textarea
                name="notes"
                maxLength={4000}
                className={`${inputClass} min-h-24`}
                placeholder="A short note about this piece"
              />
            </label>
            <div className="space-y-3">
              <label className="block text-sm">
                Clothing photo <span aria-hidden="true">*</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  aria-describedby="wardrobe-new-image-help"
                  className={`${inputClass} file:bg-primary file:text-primary-foreground file:mr-3 file:rounded-full file:border-0 file:px-3 file:py-1`}
                  onChange={() => {
                    setUploadedAssetId("");
                    setUpload(idleUpload);
                    setActionState(emptyActionState);
                  }}
                />
              </label>
              <p
                id="wardrobe-new-image-help"
                className="text-secondary text-xs"
              >
                JPEG, PNG, or WebP up to 10 MiB. Upload the photo before saving.
              </p>
              <Button
                type="button"
                className="border-border bg-background text-foreground hover:bg-muted border"
                disabled={!enabled || upload.pending || isSaving}
                onClick={handleImageUpload}
              >
                {upload.pending
                  ? upload.progress === null
                    ? "Preparing upload…"
                    : "Uploading photo…"
                  : uploadedAssetId
                    ? "Upload a different photo"
                    : "Upload photo"}
              </Button>
              {upload.progress !== null && upload.pending && (
                <div className="space-y-1">
                  <progress
                    aria-label="Photo upload progress"
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
            </div>
          </fieldset>

          <input type="hidden" name="image_asset_id" value={uploadedAssetId} />
          {uploadedAssetId && (
            <Button type="submit" disabled={!enabled || isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          )}
          {!enabled && (
            <p role="status" className="text-secondary text-sm">
              Connect Supabase and enable demo writes to add wardrobe items.
            </p>
          )}
          {actionState.message && !actionState.ok && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-primary text-sm"
            >
              {actionState.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
