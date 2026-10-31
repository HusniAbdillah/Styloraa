import { InvalidInputError, ConflictError } from "@/lib/errors";
import { studioCapabilities } from "@/features/capsules/queries";
import {
  StudioHeading,
  StudioState,
  StudioLink,
} from "@/features/capsules/components/studio-ui";
import { loadPreview } from "../queries";
import { PreviewScreen } from "./preview-screen";
import type { PreviewScreenData } from "../types";

export async function PreviewPage({
  type,
  id,
  capsuleId,
  optionId,
}: {
  type: "wardrobe_item" | "look" | "capsule_outfit";
  id: string;
  capsuleId?: string;
  optionId?: string;
}) {
  let data: PreviewScreenData | undefined;
  let message: string | undefined;
  try {
    data = await loadPreview(type, id, capsuleId, optionId);
  } catch (error) {
    if (
      !(error instanceof InvalidInputError) &&
      !(error instanceof ConflictError)
    )
      throw error;
    message = error.message;
  }
  if (!data) {
    return (
      <>
        <StudioHeading title="A preview starts with owned pieces." />
        <StudioState
          title="Review this selection"
          action={
            <StudioLink
              href={type === "look" ? `/looks/${id}` : "/capsules"}
              secondary
            >
              Return to the collection
            </StudioLink>
          }
        >
          <p>{message}</p>
        </StudioState>
      </>
    );
  }
  return <PreviewScreen data={data} writes={studioCapabilities().writes} />;
}
