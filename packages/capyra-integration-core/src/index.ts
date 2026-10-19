import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type {
  AnalysisDetailResponseContract,
  LatestAnalysisListOptionsContract,
  LatestAnalysisListResponseContract,
  AnalysisListResponseContract,
  AnalysisSkillCatalogResponseContract,
  AnalysisSkillId,
  ErrorResponseContract,
  OAuthDeviceCodeResponseContract,
  OAuthSessionResponseContract,
  OAuthTokenResponseContract,
  SourceAssetDirectUploadCompleteRequestContract,
  SourceAssetDirectUploadCreateRequestContract,
  SourceAssetDirectUploadResponseContract,
  SourceAssetItemContract,
  SourceAssetListResponseContract,
  SourceAssetUploadSessionResponseContract,
  ValidationErrorResponseContract,
} from "@capyra/contracts";

export type OutputFormat = "json" | "human";

export const CAPYRA_CLI_CLIENT_ID = "capyra-cli";
export const CAPYRA_MCP_CLIENT_ID = "capyra-mcp";
export const DEFAULT_OAUTH_SCOPES = [
  "analysis-skills:read",
  "source-assets:read",
  "source-assets:write",
  "analyses:create",
  "analyses:read",
] as const;

export interface CapyraClientOptions {
  baseUrl?: string;
  accessToken?: string | null;
  fetchImpl?: typeof fetch;
}

export interface DeviceAuthorizationOptions {
  clientId?: string;
  scopes?: string[];
}

export interface DeviceAuthorizationResult {
  deviceCode: OAuthDeviceCodeResponseContract;
  token: NormalizedOAuthTokenResponse;
}

export interface TokenStoreRecord {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  user: NormalizedOAuthTokenResponse["user"];
  account: NormalizedOAuthTokenResponse["account"];
}

export interface TokenStore {
  read(): Promise<TokenStoreRecord | null>;
  write(record: TokenStoreRecord): Promise<void>;
  clear(): Promise<void>;
}

export interface NormalizedOAuthTokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
  scope: string;
  user: OAuthTokenResponseContract["user"];
  account: OAuthTokenResponseContract["account"];
}

type LegacyOAuthTokenResponse = NormalizedOAuthTokenResponse;
type OAuthTokenWireResponse = OAuthTokenResponseContract | LegacyOAuthTokenResponse;

export class CapyraApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown> | null;
  fieldErrors: Array<{ field: string; message: string }>;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
    fieldErrors?: Array<{ field: string; message: string }>;
  }) {
    super(options.message);
    this.name = "CapyraApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? null;
    this.fieldErrors = options.fieldErrors ?? [];
  }
}

export function formatApiError(error: unknown) {
  if (error instanceof CapyraApiError) {
    const fieldSuffix =
      error.fieldErrors.length > 0
        ? ` (${error.fieldErrors.map((item) => `${item.field}: ${item.message}`).join("; ")})`
        : "";
    return `${error.code}: ${error.message}${fieldSuffix}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parseError(response: Response): Promise<CapyraApiError> {
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
    const fieldErrors = Array.isArray((payload as ValidationErrorResponseContract).fieldErrors)
      ? (payload as ValidationErrorResponseContract).fieldErrors
      : [];

    return new CapyraApiError({
      status: response.status,
      code: payload.code ?? "api_error",
      message: payload.message ?? `Request failed with status ${response.status}`,
      details: payload.details ?? null,
      fieldErrors,
    });
  }

  return new CapyraApiError({
    status: response.status,
    code: "api_error",
    message: `Request failed with status ${response.status}`,
  });
}

function normalizeBaseUrl(baseUrl?: string) {
  return (baseUrl ?? process.env.CAPYRA_API_BASE_URL ?? "https://api.capyra.co/api/v1").replace(/\/$/, "");
}

function getVideoContentType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    default:
      return "application/octet-stream";
  }
}

export class CapyraClient {
  readonly baseUrl: string;
  readonly accessToken: string | null;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CapyraClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.accessToken = options.accessToken ?? null;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  withAccessToken(accessToken: string | null) {
    return new CapyraClient({
      baseUrl: this.baseUrl,
      accessToken,
      fetchImpl: this.fetchImpl,
    });
  }

  async request<T>(pathName: string, options: { method?: string; body?: unknown; accessToken?: string | null } = {}) {
    const body = options.body;
    const response = await this.fetchImpl(`${this.baseUrl}${pathName}`, {
      method: options.method ?? "GET",
      headers: {
        ...(body != null && !isFormData(body) ? { "content-type": "application/json" } : {}),
        ...((options.accessToken ?? this.accessToken) ? { authorization: `Bearer ${options.accessToken ?? this.accessToken}` } : {}),
      },
      body:
        body == null
          ? undefined
          : isFormData(body)
            ? body
            : JSON.stringify(body),
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async requestForm<T>(pathName: string, form: URLSearchParams) {
    const response = await this.fetchImpl(`${this.baseUrl}${pathName}`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async requestOAuthToken(pathName: string, form: URLSearchParams) {
    const token = await this.requestForm<OAuthTokenWireResponse>(pathName, form);
    return normalizeOAuthTokenResponse(token);
  }

  getOAuthSession() {
    return this.request<OAuthSessionResponseContract>("/oauth/session");
  }

  createDeviceCode(request: { clientId: string; scopes?: string[] }) {
    return this.request<OAuthDeviceCodeResponseContract>("/oauth/device/code", {
      method: "POST",
      body: request,
    });
  }

  exchangeAuthorizationCode(request: {
    clientId: string;
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }) {
    const form = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: request.clientId,
      code: request.code,
      redirect_uri: request.redirectUri,
      code_verifier: request.codeVerifier,
    });
    return this.requestOAuthToken("/oauth/token", form);
  }

  exchangeDeviceCode(request: { clientId: string; deviceCode: string }) {
    const form = new URLSearchParams({
      grant_type: "device_code",
      client_id: request.clientId,
      device_code: request.deviceCode,
    });
    return this.requestOAuthToken("/oauth/token", form);
  }

  refreshAccessToken(request: { clientId: string; refreshToken: string }) {
    const form = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: request.clientId,
      refresh_token: request.refreshToken,
    });
    return this.requestOAuthToken("/oauth/token", form);
  }

  revokeRefreshToken(request: { clientId: string; refreshToken: string }) {
    return this.request<void>("/oauth/revoke", {
      method: "POST",
      body: request,
    });
  }

  getAnalysisSkills() {
    return this.request<AnalysisSkillCatalogResponseContract>("/analysis-skills");
  }

  listSourceAssets(brandId?: string) {
    return this.request<SourceAssetListResponseContract>(`/source-assets${brandId ? `?brandId=${encodeURIComponent(brandId)}` : ""}`);
  }

  async uploadSourceAssetFromPath(filePath: string, brandId: string) {
    assertBrandId(brandId);
    const fileName = path.basename(filePath);
    const buffer = await readFile(filePath);
    const contentType = getVideoContentType(fileName);
    const directUploadRequest: SourceAssetDirectUploadCreateRequestContract = {
      brandId,
      fileName,
      contentType,
      contentLength: buffer.byteLength,
    };

    for (const attempt of [1, 2]) {
      const directUpload = await this.createSourceAssetDirectUpload(directUploadRequest);
      try {
        await this.uploadSourceAssetBlob(directUpload, new Blob([buffer], { type: contentType }));
      } catch (error) {
        if (attempt === 1 && error instanceof CapyraApiError && error.status === 403) {
          continue;
        }

        throw error;
      }

      return this.completeSourceAssetDirectUpload(directUpload.sourceAssetId, directUploadRequest);
    }

    throw new CapyraApiError({
      status: 403,
      code: "source_asset_upload_failed",
      message: "Source asset upload failed after retrying the Blob upload.",
    });
  }

  createSourceAssetDirectUpload(request: SourceAssetDirectUploadCreateRequestContract) {
    return this.request<SourceAssetDirectUploadResponseContract>("/source-assets/direct-uploads", {
      method: "POST",
      body: request,
    });
  }

  completeSourceAssetDirectUpload(sourceAssetId: string, request: SourceAssetDirectUploadCompleteRequestContract) {
    return this.request<SourceAssetItemContract>(`/source-assets/direct-uploads/${sourceAssetId}/complete`, {
      method: "POST",
      body: request,
    });
  }

  private async uploadSourceAssetBlob(upload: SourceAssetDirectUploadResponseContract, blob: Blob) {
    const response = await this.fetchImpl(upload.uploadUrl, {
      method: upload.method,
      headers: upload.headers,
      body: blob,
    });

    if (!response.ok) {
      throw new CapyraApiError({
        status: response.status,
        code: "source_asset_upload_failed",
        message: `Source asset upload failed with status ${response.status}`,
      });
    }
  }

  createSourceAssetUploadSession(brandId: string, clientId?: string | null) {
    assertBrandId(brandId);
    return this.request<SourceAssetUploadSessionResponseContract>("/integrations/source-asset-sessions", {
      method: "POST",
      body: { brandId, ...(clientId ? { clientId } : {}) },
    });
  }

  getSourceAssetUploadSession(sessionId: string) {
    return this.request<SourceAssetUploadSessionResponseContract>(`/integrations/source-asset-sessions/${sessionId}`);
  }

  completeSourceAssetUploadSession(sessionId: string, sourceAssetId: string) {
    return this.request<SourceAssetUploadSessionResponseContract>(`/integrations/source-asset-sessions/${sessionId}/complete`, {
      method: "POST",
      body: { sourceAssetId },
    });
  }

  createAnalysisFromUrl(url: string, skills: AnalysisSkillId[], brandId: string, language = "pt-BR") {
    assertBrandId(brandId);
    return this.request<AnalysisDetailResponseContract>("/analyses", {
      method: "POST",
      body: { url, skills, brandId, language },
    });
  }

  createAnalysisFromSourceAsset(sourceAssetId: string, skills: AnalysisSkillId[], brandId: string, language = "pt-BR") {
    assertBrandId(brandId);
    return this.request<AnalysisDetailResponseContract>("/analyses", {
      method: "POST",
      body: { sourceAssetId, skills, brandId, language },
    });
  }

  async createAnalysisFromFile(filePath: string, skills: AnalysisSkillId[], brandId: string, language = "pt-BR") {
    const asset = await this.uploadSourceAssetFromPath(filePath, brandId);
    return this.createAnalysisFromSourceAsset(asset.id, skills, brandId, language);
  }

  listAnalyses() {
    return this.request<AnalysisListResponseContract>("/analyses");
  }

  listLatestAnalyses(options: LatestAnalysisListOptionsContract = {}) {
    const params = new URLSearchParams();
    if (options.limit !== undefined) {
      params.set("limit", String(options.limit));
    }
    if (options.cursor) {
      params.set("cursor", options.cursor);
    }
    if (options.includeSummary !== undefined) {
      params.set("includeSummary", String(options.includeSummary));
    }
    if (options.includeSkillDetails !== undefined) {
      params.set("includeSkillDetails", String(options.includeSkillDetails));
    }
    if (options.includePresentation !== undefined) {
      params.set("includePresentation", String(options.includePresentation));
    }

    const query = params.toString();
    return this.request<LatestAnalysisListResponseContract>(`/analyses/latest${query ? `?${query}` : ""}`);
  }

  getAnalysis(analysisId: string) {
    return this.request<AnalysisDetailResponseContract>(`/analyses/${analysisId}`);
  }
}

export async function pollAnalysis(
  client: CapyraClient,
  analysisId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
) {
  const intervalMs = options.intervalMs ?? 1_000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const analysis = await client.getAnalysis(analysisId);
    if (analysis.status !== "pending") {
      return analysis;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for analysis ${analysisId}.`);
}

export async function runDeviceAuthorization(
  client: CapyraClient,
  options: DeviceAuthorizationOptions = {},
) {
  const clientId = options.clientId ?? CAPYRA_CLI_CLIENT_ID;
  const deviceCode = await client.createDeviceCode({
    clientId,
    scopes: options.scopes,
  });

  while (true) {
    try {
      const token = await client.exchangeDeviceCode({
        clientId,
        deviceCode: deviceCode.deviceCode,
      });

      return {
        deviceCode,
        token,
      } satisfies DeviceAuthorizationResult;
    } catch (error) {
      if (error instanceof CapyraApiError && error.code === "authorization_pending") {
        await sleep(deviceCode.interval * 1_000);
        continue;
      }

      throw error;
    }
  }
}

export function toTokenStoreRecord(clientId: string, response: NormalizedOAuthTokenResponse): TokenStoreRecord {
  return {
    clientId,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: new Date(Date.now() + response.expiresIn * 1_000).toISOString(),
    scope: response.scope,
    user: response.user,
    account: response.account,
  };
}

export function normalizeOAuthTokenResponse(response: OAuthTokenWireResponse): NormalizedOAuthTokenResponse {
  if ("access_token" in response) {
    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in,
      refreshToken: response.refresh_token,
      scope: response.scope,
      user: response.user,
      account: response.account,
    };
  }

  return response;
}

export function isTokenExpired(record: Pick<TokenStoreRecord, "expiresAt">, skewSeconds = 30) {
  const expiresAt = new Date(record.expiresAt);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() + skewSeconds * 1_000;
}

export async function refreshStoredSession(client: CapyraClient, record: TokenStoreRecord) {
  const response = await client.refreshAccessToken({
    clientId: record.clientId,
    refreshToken: record.refreshToken,
  });

  return toTokenStoreRecord(record.clientId, response);
}

export function createLocalTokenStore(filePath = path.join(os.homedir(), ".capyra", "cli-session.json")): TokenStore {
  return {
    async read() {
      try {
        const content = await readFile(filePath, "utf8");
        return JSON.parse(content) as TokenStoreRecord;
      } catch {
        return null;
      }
    },
    async write(record) {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
    },
    async clear() {
      await rm(filePath, { force: true });
    },
  };
}

export async function getAuthenticatedClient(baseClient: CapyraClient, store: TokenStore) {
  const session = await store.read();
  if (!session) {
    throw new Error("No Capyra session found. Run `capyra login` first.");
  }

  if (!isTokenExpired(session)) {
    return {
      client: baseClient.withAccessToken(session.accessToken),
      session,
    };
  }

  const refreshed = await refreshStoredSession(baseClient, session);
  await store.write(refreshed);
  return {
    client: baseClient.withAccessToken(refreshed.accessToken),
    session: refreshed,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertBrandId(brandId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId ?? "")) {
    throw new CapyraApiError({ status: 422, code: "brand_required", message: "Choose a Brand UUID explicitly. Use whoami or auth_status to inspect available Brands." });
  }
}
