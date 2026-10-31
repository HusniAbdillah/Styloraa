import {
  getPreviewJob,
  deletePreviewResult,
} from "@/features/preview/repository";
import {
  checkDatabase,
  checkWrites,
  invalidId,
  isUuid,
  mapRouteError,
} from "@/app/api/helpers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ jobId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const blocked = checkDatabase() ?? checkWrites();
  if (blocked) return blocked;
  const { jobId } = await params;
  if (!isUuid(jobId)) return invalidId();
  try {
    await deletePreviewResult(jobId);
    return Response.json({ data: { id: jobId } });
  } catch (error) {
    return mapRouteError(error);
  }
}

/** Preview job status/result. Rows appear once a visual provider is live. */
export async function GET(_request: Request, { params }: Params) {
  const blocked = checkDatabase();
  if (blocked) return blocked;
  const { jobId } = await params;
  if (!isUuid(jobId)) return invalidId();
  try {
    const data = await getPreviewJob(jobId);
    return Response.json(
      { data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return mapRouteError(error);
  }
}
