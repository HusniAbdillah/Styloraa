import { CompareView } from "@/features/products/components/compare-view";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lookId: string }>;
  searchParams: Promise<{ option_id?: string }>;
}) {
  const { lookId } = await params;
  const { option_id: optionId } = await searchParams;
  return <CompareView lookId={lookId} optionId={optionId} />;
}
