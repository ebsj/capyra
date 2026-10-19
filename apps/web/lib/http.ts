import type {
  ErrorResponseContract,
  ValidationErrorResponseContract,
} from "@/lib/models";
import { redirectClientToSessionExpiredLogin } from "@/lib/session";

export class ApiError extends Error {
  status: number;
  code: string;
  traceId: string | null;
  details: Record<string, unknown> | null;
  fieldErrors: Array<{ field: string; message: string }>;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    traceId?: string | null;
    details?: Record<string, unknown> | null;
    fieldErrors?: Array<{ field: string; message: string }>;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.traceId = options.traceId ?? null;
    this.details = options.details ?? null;
    this.fieldErrors = options.fieldErrors ?? [];
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  accessToken?: string | null;
  fetchImpl?: typeof fetch;
  redirectOnAuthFailure?: boolean;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  fetchImpl?: typeof fetch;
  redirectOnAuthFailure?: boolean;
  headers?: Record<string, string>;
}

export type ApiRequest = <T>(path: string, options?: RequestOptions) => Promise<T>;

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function parseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get("content-type") ?? "";
  let payload: ErrorResponseContract | ValidationErrorResponseContract | null = null;

  if (contentType.includes("application/json")) {
    try {
      payload = (await response.json()) as ErrorResponseContract;
    } catch {
      payload = null;
    }
  }

  if (payload) {
    const fieldErrors = "fieldErrors" in payload ? payload.fieldErrors : undefined;

    return new ApiError({
      status: response.status,
      code: payload.code ?? "api_error",
      message: payload.message ?? `Request failed with status ${response.status}`,
      traceId: payload.traceId ?? null,
      details: payload.details ?? null,
      fieldErrors: Array.isArray(fieldErrors) ? fieldErrors : [],
    });
  }

  return new ApiError({
    status: response.status,
    code: "api_error",
    message: `Request failed with status ${response.status}`,
  });
}

async function request<T>(baseUrl: string, path: string, options: RequestOptions = {}) {
  const isFormData = isFormDataBody(options.body);
  let body: BodyInit | undefined;
  if (options.body == null) {
    body = undefined;
  } else if (isFormDataBody(options.body)) {
    body = options.body;
  } else {
    body = JSON.stringify(options.body);
  }
  const response = await (options.fetchImpl ?? fetch)(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...options.headers,
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await parseError(response);
    if (
      options.redirectOnAuthFailure !== false &&
      (error.status === 401 || (error.status === 403 && error.code === "account_access_revoked")) &&
      typeof window !== "undefined" &&
      baseUrl.startsWith("/api/")
    ) {
      redirectClientToSessionExpiredLogin(window.location.pathname);
    }

    throw error;
  }

  return parseResponse<T>(response);
}

export function createApiRequest(options: HttpClientOptions): ApiRequest {
  const baseOptions: RequestOptions = {
    accessToken: options.accessToken,
    fetchImpl: options.fetchImpl,
    redirectOnAuthFailure: options.redirectOnAuthFailure,
  };

  return <T>(path: string, requestOptions: RequestOptions = {}) =>
    request<T>(options.baseUrl, path, { ...baseOptions, ...requestOptions });
}

export function getDefaultApiBaseUrl() {
  return process.env.CAPYRA_API_BASE_URL ?? "http://localhost:5080/api/v1";
}

export function createBrowserApiRequest(accessToken?: string | null) {
  return createApiRequest({ baseUrl: "/api/v1", accessToken, redirectOnAuthFailure: true });
}
