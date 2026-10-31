import { CapsuleIndex } from "@/features/capsules/components/capsule-index";
import {
  loadCapsuleIndex,
  selectedLookItems,
  studioCapabilities,
} from "@/features/capsules/queries";
import { notFound } from "next/navigation";
import { z } from "zod";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    fromLook?: string;
    pieces?: string;
    fromOption?: string;
  }>;
}) {
  const [data, params] = await Promise.all([loadCapsuleIndex(), searchParams]);
  const look =
    params.fromLook && !data.error
      ? await selectedLookItems(params.fromLook, params.fromOption)
      : null;
  let ids = look?.items.map((item) => item.id);
  if (look && params.pieces) {
    const parsed = z
      .array(z.uuid())
      .min(1)
      .max(100)
      .safeParse(params.pieces.split(","));
    if (
      !parsed.success ||
      new Set(parsed.data).size !== parsed.data.length ||
      parsed.data.some((id) => !data.inventory.some((item) => item.id === id))
    )
      notFound();
    ids = parsed.data;
  }
  return (
    <CapsuleIndex
      {...data}
      writes={studioCapabilities().writes}
      initialCreate={!!look}
      initialIds={ids}
      initialTitle={look ? `${look.title} capsule`.slice(0, 120) : undefined}
    />
  );
}
