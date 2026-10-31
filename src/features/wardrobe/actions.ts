"use server";

import { revalidatePath } from "next/cache";
import { getServerEnv, isDatabaseConfigured } from "@/lib/env";
import {
  archiveWardrobeItem as archiveWardrobeItemInRepository,
  attachWardrobeImage,
  insertWardrobeItem,
  removeWardrobeImage as removeWardrobeImageInRepository,
  updateWardrobeItem as updateWardrobeItemInRepository,
  WardrobeItemNotFoundError,
} from "./repository";
import {
  imageBytesMatchMimeType,
  wardrobeImageMetadataSchema,
  wardrobeItemIdSchema,
  wardrobeItemSchema,
} from "./schema";

export type WardrobeActionState = { ok: boolean; message: string };

function parseItemInput(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData);
  if (typeof raw.attributes === "string" && raw.attributes.trim()) {
    try {
      raw.attributes = JSON.parse(raw.attributes);
    } catch {
      return {
        success: false as const,
        message: "Attributes must be valid JSON.",
      };
    }
  }
  const parsed = wardrobeItemSchema.safeParse(raw);
  return parsed.success
    ? { success: true as const, data: parsed.data }
    : {
        success: false as const,
        message: parsed.error.issues[0]?.message ?? "Invalid item details.",
      };
}

function writesEnabled() {
  if (!isDatabaseConfigured()) return false;
  try {
    return getServerEnv().DEMO_WRITES_ENABLED === "true";
  } catch {
    return false;
  }
}

function invalidateWardrobe() {
  revalidatePath("/wardrobe");
  revalidatePath("/create");
  revalidatePath("/capsules");
}

function actionError(error: unknown, fallback: string) {
  return error instanceof WardrobeItemNotFoundError
    ? { ok: false, message: "Wardrobe item not found." }
    : { ok: false, message: fallback };
}

export async function addWardrobeItem(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const input = parseItemInput(formData);
  if (!input.success) return { ok: false, message: input.message };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };
  try {
    await insertWardrobeItem(input.data);
    invalidateWardrobe();
    return { ok: true, message: "Item added to the shared wardrobe." };
  } catch (error) {
    return actionError(
      error,
      "Could not save the item. Check the database configuration and migrations.",
    );
  }
}

export async function editWardrobeItem(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const id = wardrobeItemIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid wardrobe item." };
  const input = parseItemInput(formData);
  if (!input.success) return { ok: false, message: input.message };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };
  try {
    await updateWardrobeItemInRepository(id.data, input.data);
    invalidateWardrobe();
    return { ok: true, message: "Wardrobe item updated." };
  } catch (error) {
    return actionError(error, "Could not update the item. Please try again.");
  }
}

export async function removeWardrobeItem(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const id = wardrobeItemIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid wardrobe item." };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };
  try {
    await archiveWardrobeItemInRepository(id.data);
    invalidateWardrobe();
    return { ok: true, message: "Item removed from the active wardrobe." };
  } catch (error) {
    return actionError(error, "Could not remove the item. Please try again.");
  }
}

export async function uploadWardrobeImage(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const id = wardrobeItemIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid wardrobe item." };
  const file = formData.get("image");
  if (!(file instanceof File))
    return { ok: false, message: "Choose an image file to upload." };

  const metadata = wardrobeImageMetadataSchema.safeParse({
    mimeType: file.type,
    byteSize: file.size,
  });
  if (!metadata.success)
    return {
      ok: false,
      message: "Use a JPEG, PNG, or WebP image up to 10 MB.",
    };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      bytes.byteLength !== metadata.data.byteSize ||
      !imageBytesMatchMimeType(bytes, metadata.data.mimeType)
    ) {
      return {
        ok: false,
        message: "The file contents do not match a supported image type.",
      };
    }

    await attachWardrobeImage(id.data, {
      bytes,
      mimeType: metadata.data.mimeType,
    });
    invalidateWardrobe();
    return { ok: true, message: "Wardrobe image uploaded." };
  } catch (error) {
    return actionError(error, "Could not upload the image. Please try again.");
  }
}

export async function removeWardrobeImage(
  _previous: WardrobeActionState,
  formData: FormData,
): Promise<WardrobeActionState> {
  const id = wardrobeItemIdSchema.safeParse(formData.get("id"));
  if (!id.success) return { ok: false, message: "Invalid wardrobe item." };
  if (!writesEnabled())
    return { ok: false, message: "Demo writes are not enabled." };
  try {
    await removeWardrobeImageInRepository(id.data);
    invalidateWardrobe();
    return { ok: true, message: "Wardrobe image removed." };
  } catch (error) {
    return actionError(error, "Could not remove the image. Please try again.");
  }
}
