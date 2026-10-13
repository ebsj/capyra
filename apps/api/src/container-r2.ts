import { DIRECT_UPLOAD_MAX_BYTES } from "./common";
import type { RuntimeEnv } from "./runtime";

const ALLOWED_METHODS = "GET, HEAD, PUT";

function objectKey(request: Request): string | null {
  const segments = new URL(request.url).pathname.split("/").slice(1);
  if (!segments.length || segments.some((segment) => !segment)) return null;

  try {
    const decoded = segments.map((segment) => decodeURIComponent(segment));
    if (decoded.some((segment) => segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\") || segment.includes("\0"))) {
      return null;
    }
    return decoded.join("/");
  } catch {
    return null;
  }
}

function objectHeaders(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-length", String(object.size));
  headers.set("etag", object.httpEtag);
  return headers;
}

export async function handleContainerR2Request(request: Request, env: RuntimeEnv): Promise<Response> {
  const key = objectKey(request);
  if (!key) return new Response("Invalid object key.", { status: 400 });

  if (request.method === "GET") {
    const object = await env.STORAGE.get(key);
    if (!object) return new Response(null, { status: 404 });
    return new Response(object.body, { headers: objectHeaders(object) });
  }

  if (request.method === "HEAD") {
    const object = await env.STORAGE.head(key);
    if (!object) return new Response(null, { status: 404 });
    return new Response(null, { headers: objectHeaders(object) });
  }

  if (request.method === "PUT") {
    const contentLengthHeader = request.headers.get("content-length") ?? "";
    const contentLength = /^\d+$/.test(contentLengthHeader) ? Number(contentLengthHeader) : Number.NaN;
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      return new Response("A valid Content-Length header is required.", { status: 411 });
    }
    if (contentLength > DIRECT_UPLOAD_MAX_BYTES) {
      return new Response("Object exceeds 200 MB.", { status: 413 });
    }
    if (!request.body && contentLength !== 0) return new Response("Request body is required.", { status: 400 });

    const object = await env.STORAGE.put(key, request.body ?? new Uint8Array(), {
      httpMetadata: { contentType: request.headers.get("content-type") ?? "application/octet-stream" },
      customMetadata: request.headers.has("x-capyra-analysis-id")
        ? { analysisId: request.headers.get("x-capyra-analysis-id")! }
        : undefined,
    });
    return new Response(null, { status: 201, headers: { etag: object.httpEtag } });
  }

  return new Response("Method not allowed.", { status: 405, headers: { allow: ALLOWED_METHODS } });
}
