import { getRandom } from "@cloudflare/containers";
import {
  ApiError,
  nowIso,
  addSeconds,
  safeFileName,
  DIRECT_UPLOAD_MAX_BYTES,
} from "./common";
import type { AnalysisContainer } from "./processor";
import type { RuntimeEnv } from "./runtime";

export interface MediaMetadata {
  width: number;
  height: number;
  durationSeconds?: number;
  codec?: string;
  format?: string;
}
export function validateMediaMetadata(
  fileName: string,
  contentType: string,
  size: number
): "video" | "image" {
  const ext = safeFileName(fileName).split(".").pop()?.toLowerCase() ?? "";
  const types: Record<string, string[]> = {
    mp4: ["video/mp4"],
    mov: ["video/quicktime"],
    webm: ["video/webm"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
  };
  if (
    !types[ext] ||
    (contentType !== "application/octet-stream" &&
      !types[ext].includes(contentType))
  )
    throw new ApiError(
      422,
      "unsupported_media",
      "Use MP4, MOV, WEBM, JPEG, PNG or WEBP with matching content type."
    );
  if (!Number.isSafeInteger(size) || size < 1 || size > DIRECT_UPLOAD_MAX_BYTES)
    throw new ApiError(
      413,
      "file_too_large",
      "Media must be between 1 byte and 200 MB."
    );
  return ["jpg", "jpeg", "png", "webp"].includes(ext) ? "image" : "video";
}
export async function probeMedia(
  env: RuntimeEnv,
  input: {
    source_object_key?: string;
    source_label?: string;
    video_url?: string;
    media_kind?: "image" | "video";
  }
): Promise<MediaMetadata> {
  const container = await getRandom(
    env.ANALYSIS_CONTAINER as DurableObjectNamespace<AnalysisContainer>,
    2
  );
  const response = await container.fetch("http://container/jobs/probe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok)
    throw new ApiError(
      response.status >= 500 ? 503 : 422,
      "media_probe_failed",
      "Media inspection failed. Upload a valid supported file or try again."
    );
  const metadata = await response.json<MediaMetadata>();
  if (
    !Number.isFinite(metadata.width) ||
    metadata.width < 1 ||
    !Number.isFinite(metadata.height) ||
    metadata.height < 1
  )
    throw new ApiError(
      422,
      "invalid_media",
      "Media dimensions could not be verified."
    );
  return metadata;
}
export function assertAnalyzable(metadata: MediaMetadata, kind: string): void {
  if (kind !== "video")
    throw new ApiError(
      422,
      "video_required",
      "Image analysis is not supported."
    );
  if (
    typeof metadata.durationSeconds !== "number" ||
    !Number.isFinite(metadata.durationSeconds) ||
    metadata.durationSeconds <= 0 ||
    metadata.durationSeconds > 180
  )
    throw new ApiError(
      422,
      "analysis_duration_exceeded",
      "Analysis accepts videos up to 180 seconds."
    );
}
export async function consumeMediaProbe(
  env: RuntimeEnv,
  message: { body: { id: string }; attempts: number }
): Promise<void> {
  const now = nowIso();
  const lease = await env.DB.prepare(
    "UPDATE source_assets SET probe_lease_expires_at=?,probe_attempts=probe_attempts+1 WHERE id=? AND metadata_status='pending' AND upload_status='completed' AND deleted_at IS NULL AND (probe_lease_expires_at IS NULL OR probe_lease_expires_at<?)"
  )
    .bind(addSeconds(now, 300), message.body.id, now)
    .run();
  if (!lease.meta.changes) return;
  const row = await env.DB.prepare(
    "SELECT object_key,source_label,media_kind FROM source_assets WHERE id=?"
  )
    .bind(message.body.id)
    .first<{
      object_key: string;
      source_label: string;
      media_kind: "image" | "video";
    }>();
  if (!row) return;
  try {
    const metadata = await probeMedia(env, {
      source_object_key: row.object_key,
      source_label: row.source_label,
      media_kind: row.media_kind,
    });
    await env.DB.prepare(
      "UPDATE source_assets SET metadata_status='ready',metadata_json=?,probe_lease_expires_at=NULL WHERE id=? AND metadata_status='pending'"
    )
      .bind(JSON.stringify(metadata), message.body.id)
      .run();
  } catch (error) {
    await env.DB.prepare(
      "UPDATE source_assets SET probe_lease_expires_at=NULL WHERE id=?"
    )
      .bind(message.body.id)
      .run();
    if (error instanceof ApiError && error.status === 422) {
      await markMediaProbeFailure(env, message.body.id);
      return;
    }
    throw error;
  }
}
export async function markMediaProbeFailure(
  env: RuntimeEnv,
  id: string
): Promise<void> {
  await env.DB.prepare(
    "UPDATE source_assets SET metadata_status='failed',probe_lease_expires_at=NULL WHERE id=? AND metadata_status='pending'"
  )
    .bind(id)
    .run();
}
export async function reconcileMediaProbes(env: RuntimeEnv): Promise<void> {
  const now = nowIso();
  await env.DB.prepare(
    "UPDATE source_assets SET metadata_status='failed',probe_lease_expires_at=NULL WHERE metadata_status='pending' AND probe_attempts>=6 AND (probe_lease_expires_at IS NULL OR probe_lease_expires_at<?)"
  )
    .bind(now)
    .run();
  const rows = await env.DB.prepare(
    "SELECT id FROM source_assets WHERE metadata_status='pending' AND upload_status='completed' AND deleted_at IS NULL AND probe_attempts<6 AND (probe_lease_expires_at IS NULL OR probe_lease_expires_at<?) LIMIT 100"
  )
    .bind(now)
    .all<{ id: string }>();
  if (rows.results.length)
    await env.SOCIAL_QUEUE.sendBatch(
      rows.results.map(({ id }) => ({
        body: { kind: "probe" as const, id },
        contentType: "json" as const,
      }))
    );
}
