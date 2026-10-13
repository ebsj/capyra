export const ALLOWED_SOURCE_ASSET_EXTENSIONS = [".mp4", ".mov", ".webm"];
export const MAX_SOURCE_ASSET_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export const SOURCE_ASSET_UPLOAD_SESSION_STATUS_LABELS = {
  pending: "Pendente",
  completed: "Concluída",
  expired: "Expirada",
} as const;

export function getSourceAssetFileExtension(fileName: string) {
  return `.${fileName.split(".").pop()?.toLowerCase() ?? ""}`;
}

export function formatSourceAssetFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}
