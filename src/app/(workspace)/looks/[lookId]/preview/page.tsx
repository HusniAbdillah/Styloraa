import { PreviewPage } from "@/features/preview/components/preview-page";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ lookId: string }>;
}) {
  const data = await params;
  return <PreviewPage type="look" id={data.lookId} />;
}
