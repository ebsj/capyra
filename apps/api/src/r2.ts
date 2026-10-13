import { AwsClient } from "aws4fetch";
import { DIRECT_UPLOAD_MAX_BYTES } from "./common";
import type { RuntimeEnv } from "./runtime";

const encoder = new TextEncoder();

interface LocalUploadClaims {
  key: string;
  contentType: string;
  contentLength: number;
  expiresAt: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0));
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function localUploadToken(env: RuntimeEnv, claims: LocalUploadClaims): Promise<string> {
  if (!env.CAPYRA_AUTH_SIGNING_KEY) throw new Error("CAPYRA_AUTH_SIGNING_KEY is required for local upload tickets.");
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await signingKey(env.CAPYRA_AUTH_SIGNING_KEY), encoder.encode(payload)));
  return `${payload}.${base64UrlEncode(signature)}`;
}

async function verifyLocalUploadToken(env: RuntimeEnv, token: string): Promise<LocalUploadClaims | null> {
  if (!env.CAPYRA_AUTH_SIGNING_KEY) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await signingKey(env.CAPYRA_AUTH_SIGNING_KEY), base64UrlDecode(signature), encoder.encode(payload));
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as LocalUploadClaims;
    if (!claims.key || !claims.contentType || !Number.isSafeInteger(claims.contentLength) || claims.contentLength <= 0
      || claims.contentLength > DIRECT_UPLOAD_MAX_BYTES || !Number.isSafeInteger(claims.expiresAt) || claims.expiresAt < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

function client(env: RuntimeEnv): AwsClient {
  return new AwsClient({
    accessKeyId: env.CAPYRA_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CAPYRA_R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
}

function objectUrl(env: RuntimeEnv, key: string): URL {
  return new URL(`${env.CAPYRA_R2_PUBLIC_ENDPOINT.replace(/\/$/, "")}/${env.CAPYRA_R2_BUCKET_NAME}/${key.split("/").map(encodeURIComponent).join("/")}`);
}

export async function presignR2(
  env: RuntimeEnv,
  key: string,
  method: "GET" | "PUT",
  expiresSeconds = 900,
  headers: HeadersInit = {},
): Promise<Request> {
  const url = objectUrl(env, key);
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  return client(env).sign(url, { method, headers, aws: { signQuery: true } });
}

export async function uploadRequest(
  env: RuntimeEnv,
  origin: string,
  key: string,
  contentType: string,
  contentLength: number,
  expiresSeconds = 900,
): Promise<Request> {
  if (String(env.CAPYRA_ENVIRONMENT) !== "local") {
    return presignR2(env, key, "PUT", expiresSeconds, { "Content-Type": contentType });
  }
  const token = await localUploadToken(env, {
    key,
    contentType,
    contentLength,
    expiresAt: Date.now() + expiresSeconds * 1_000,
  });
  const url = new URL("/__dev/r2-upload", origin);
  url.searchParams.set("token", token);
  return new Request(url, { method: "PUT", headers: { "Content-Type": contentType } });
}

export async function handleLocalUpload(request: Request, env: RuntimeEnv): Promise<Response> {
  const claims = await verifyLocalUploadToken(env, new URL(request.url).searchParams.get("token") ?? "");
  if (!claims) return new Response("Invalid or expired upload ticket.", { status: 403 });
  const contentLengthHeader = request.headers.get("content-length") ?? "";
  const contentLength = /^\d+$/.test(contentLengthHeader) ? Number(contentLengthHeader) : Number.NaN;
  if (contentLength !== claims.contentLength) return new Response("Upload size does not match its ticket.", { status: 409 });
  if ((request.headers.get("content-type") ?? "") !== claims.contentType) {
    return new Response("Upload content type does not match its ticket.", { status: 409 });
  }
  if (!request.body) return new Response("Request body is required.", { status: 400 });
  const object = await env.STORAGE.put(claims.key, request.body, { httpMetadata: { contentType: claims.contentType } });
  return new Response(null, { status: 201, headers: { etag: object.httpEtag } });
}
