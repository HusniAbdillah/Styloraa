import { PreviewPage } from "@/features/preview/components/preview-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lookId: string }>;
  searchParams: Promise<{ option_id?: string }>;
}) {
  const data = await params;
  return (
    <PreviewPage
      type="look"
      id={data.lookId}
      optionId={(await searchParams).option_id}
    />
  );
}
