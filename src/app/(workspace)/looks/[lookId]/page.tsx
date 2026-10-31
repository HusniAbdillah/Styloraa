import { SelectedLookView } from "@/features/decisions/components/selected-look-view";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lookId: string }>;
  searchParams: Promise<{ option_id?: string }>;
}) {
  const { lookId } = await params;
  const { option_id: optionId } = await searchParams;
  return <SelectedLookView lookId={lookId} optionId={optionId} />;
}
