import { PreviewPage } from "@/features/preview/components/preview-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const data = await params;
  return <PreviewPage type="wardrobe_item" id={data.itemId} />;
}
