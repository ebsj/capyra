import { NextResponse, type NextRequest } from "next/server";

import { getDefaultApiBaseUrl } from "@/lib/http";
import { fetchServerApi } from "@/lib/http.server";
import { readActiveAuthSessionFromCookieStore } from "@/lib/session.server";

const forwardedRequestHeaders = ["accept", "content-type", "range", "if-range", "idempotency-key"] as const;
const forwardedResponseHeaders = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "content-disposition",
  "cache-control",
  "retry-after",
] as const;

function buildTargetUrl(pathSegments: string[], search: string) {
  const baseUrl = new URL(getDefaultApiBaseUrl());
  const joinedPath = [baseUrl.pathname.replace(/\/$/, ""), ...pathSegments]
    .filter(Boolean)
    .join("/")
    .replace(/\/+/g, "/");

  baseUrl.pathname = joinedPath.startsWith("/") ? joinedPath : `/${joinedPath}`;
  baseUrl.search = search;
  return baseUrl;
}

export async function proxyApiRequest(request: NextRequest, pathSegments: string[]) {
  const session = await readActiveAuthSessionFromCookieStore();
  const accessToken = session?.accessToken ?? null;
  const targetUrl = buildTargetUrl(pathSegments, new URL(request.url).search);
  const headers = new Headers();
  const authorization = request.headers.get("authorization") ?? (accessToken ? `Bearer ${accessToken}` : null);

  for (const headerName of forwardedRequestHeaders) {
    const value = request.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  if (authorization) {
    headers.set("authorization", authorization);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? request.body : undefined;

  const init: RequestInit = {
    method: request.method,
    headers,
    body,
    // Required by Node fetch when forwarding a request body stream.
    ...(hasBody ? ({ duplex: "half" } as RequestInit) : {}),
    cache: "no-store",
  };
  const upstream = await fetchServerApi(targetUrl, init);

  const responseHeaders = new Headers();

  for (const headerName of forwardedResponseHeaders) {
    const value = upstream.headers.get(headerName);
    if (value) {
      responseHeaders.set(headerName, value);
    }
  }

  return new NextResponse(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
