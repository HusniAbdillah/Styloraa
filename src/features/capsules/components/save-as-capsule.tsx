"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/arc/button/button";

export function SaveAsCapsule({
  lookId,
  selectedItemIds,
  disabled = false,
  sourceOptionId,
}: {
  lookId: string;
  selectedItemIds: string[];
  disabled?: boolean;
  sourceOptionId?: string;
}) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      disabled={disabled || !selectedItemIds.length}
      onClick={() =>
        router.push(
          `/capsules?fromLook=${encodeURIComponent(lookId)}&pieces=${encodeURIComponent(selectedItemIds.join(","))}${sourceOptionId ? `&fromOption=${encodeURIComponent(sourceOptionId)}` : ""}`,
        )
      }
    >
      Save as capsule
    </Button>
  );
}
