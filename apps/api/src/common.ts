import type { AppContext } from "./runtime";

export const DIRECT_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;
export const MULTIPART_MAX_BYTES = 100 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
export const ALLOWED_CONTENT_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
]);

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function errorResponse(c: AppContext, error: ApiError): Response {
  return c.json({
    code: error.code,
    message: error.message,
    traceId: c.get("requestId"),
    details: error.details ?? null,
  }, error.status as 400);
}

export function validationError(
  c: AppContext,
  fieldErrors: Array<{ field: string; message: string }>,
): Response {
  return c.json({
    code: "validation_error",
    message: "The request payload is invalid.",
    traceId: c.get("requestId"),
    details: null,
    fieldErrors,
  }, 422);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}

export function uuidv7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const millis = BigInt(Date.now());
  for (let index = 0; index < 6; index += 1) {
    bytes[5 - index] = Number((millis >> BigInt(index * 8)) & 0xffn);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function safeFileName(value: string): string {
  return value.split(/[\\/]/).pop()?.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 180) || "video.mp4";
}

export function validateVideoMetadata(fileName: string, contentType: string, contentLength: number): void {
  const extension = safeFileName(fileName).split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new ApiError(422, "validation_error", "Only MP4, MOV, and WEBM files are supported.");
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new ApiError(422, "validation_error", "The content type is not supported.");
  }
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > DIRECT_UPLOAD_MAX_BYTES) {
    throw new ApiError(413, "file_too_large", "The video must be between 1 byte and 200 MB.", {
      maxFileSizeBytes: DIRECT_UPLOAD_MAX_BYTES,
    });
  }
}

export function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function normalizeR2Path(path: string): string | null {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\0")) return null;
  return normalized;
}
