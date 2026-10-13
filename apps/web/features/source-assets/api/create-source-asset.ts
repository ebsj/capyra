import { ApiError } from "@/lib/http";
import type {
  SourceAssetDirectUploadCreateRequestContract,
  SourceAssetItemContract,
} from "@/lib/models";

import { completeSourceAssetDirectUpload } from "./complete-source-asset-direct-upload";
import { createSourceAssetDirectUpload } from "./create-source-asset-direct-upload";
import { uploadDirectSourceAssetBlob } from "./upload-direct-source-asset-blob";

function buildSourceAssetDirectUploadRequest(file: File, brandId: string, variantOfAssetId?: string): SourceAssetDirectUploadCreateRequestContract {
  return {
    brandId,
    variantOfAssetId,
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    contentLength: file.size,
  };
}

export async function createSourceAsset(accessToken: string, file: File, brandId: string, variantOfAssetId?: string): Promise<SourceAssetItemContract> {
  const directUploadRequest = buildSourceAssetDirectUploadRequest(file, brandId, variantOfAssetId);

  for (const attempt of [1, 2]) {
    const directUpload = await createSourceAssetDirectUpload(accessToken, directUploadRequest);

    try {
      await uploadDirectSourceAssetBlob(directUpload, file);
    } catch (error) {
      if (attempt === 1 && error instanceof ApiError && error.status === 403) {
        continue;
      }

      throw error;
    }

    return completeSourceAssetDirectUpload(accessToken, directUpload.sourceAssetId, directUploadRequest);
  }

  throw new ApiError({
    status: 403,
    code: "source_asset_upload_failed",
    message: "Source asset upload failed after retrying the Blob upload.",
  });
}
