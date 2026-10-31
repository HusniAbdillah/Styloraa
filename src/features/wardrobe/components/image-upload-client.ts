export type PreparedWardrobeUpload = {
  assetId: string;
  expectedAssetId: string | null;
  uploadUrl: string;
};

export function responseCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

export function preparedWardrobeUpload(
  payload: unknown,
): PreparedWardrobeUpload | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (
    typeof value.assetId !== "string" ||
    typeof value.uploadUrl !== "string" ||
    !(
      value.expectedAssetId === null ||
      typeof value.expectedAssetId === "string"
    )
  )
    return null;
  return {
    assetId: value.assetId,
    expectedAssetId: value.expectedAssetId,
    uploadUrl: value.uploadUrl,
  };
}

export function uploadWardrobeFile(
  uploadUrl: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("IMAGE_UPLOAD_FAILED"));
    };
    request.onerror = () => reject(new Error("IMAGE_UPLOAD_FAILED"));
    request.onabort = () => reject(new Error("IMAGE_UPLOAD_FAILED"));

    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    request.send(body);
  });
}
