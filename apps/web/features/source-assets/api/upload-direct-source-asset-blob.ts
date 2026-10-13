import { ApiError } from "@/lib/http";
import type { SourceAssetDirectUploadResponseContract } from "@/lib/models";

export async function uploadDirectSourceAssetBlob(
  upload: SourceAssetDirectUploadResponseContract,
  file: File,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(upload.uploadUrl, {
    method: upload.method,
    headers: upload.headers,
    body: file,
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: "source_asset_upload_failed",
      message: `Source asset upload failed with status ${response.status}`,
    });
  }
}
