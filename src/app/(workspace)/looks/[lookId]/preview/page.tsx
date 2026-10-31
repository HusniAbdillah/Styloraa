import { PreviewScreen } from "@/features/preview/components/preview-screen";
import { loadPreview } from "@/features/preview/queries";
import { studioCapabilities } from "@/features/capsules/queries";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ lookId: string }>;
}) {
  const { lookId } = await params;
  return (
    <PreviewScreen
      data={await loadPreview("look", lookId)}
      writes={studioCapabilities().writes}
    />
  );
}
