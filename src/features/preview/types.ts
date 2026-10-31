import type { StudioItem } from "@/features/capsules/types";
export type PreviewScreenData = {
  subject: {
    type: "wardrobe_item" | "look" | "capsule_outfit";
    id: string;
    capsuleId?: string;
  };
  title: string;
  items: StudioItem[];
  pool: StudioItem[];
  endpoint: string;
  back: { href: string; label: string };
};
export type PreviewJob = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error_code: string | null;
  image_url?: string | null;
  stale?: boolean;
  input: {
    subject_type?: string;
    subject_id?: string;
    capsule_id?: string;
    item_ids?: string[];
  };
};
