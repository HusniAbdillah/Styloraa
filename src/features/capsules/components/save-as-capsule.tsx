"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/arc/button/button";

export function SaveAsCapsule({
  lookId,
  selectedItemIds,
  disabled = false,
}: {
  lookId: string;
  selectedItemIds: string[];
  disabled?: boolean;
}) {
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      disabled={disabled || !selectedItemIds.length}
      onClick={() =>
        router.push(
          `/capsules?fromLook=${encodeURIComponent(lookId)}&pieces=${encodeURIComponent(selectedItemIds.join(","))}`,
        )
      }
    >
      Save as capsule
    </Button>
  );
}
