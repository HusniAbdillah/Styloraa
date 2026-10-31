import { SelectedLookView } from "@/features/decisions/components/selected-look-view";
import { LookStudio } from "@/features/inspiration/components/look-studio";

export default async function LookPage({
  params,
  searchParams,
}: {
  params: Promise<{ lookId: string }>;
  searchParams: Promise<{ option_id?: string }>;
}) {
  const [{ lookId }, { option_id: optionId }] = await Promise.all([params, searchParams]);
  if (optionId) return <SelectedLookView lookId={lookId} optionId={optionId} />;
  return <LookStudio lookId={lookId} selectedOptionId={null} />;
}
