import type { Context, MiddlewareHandler } from "hono";
import type { JWTPayload } from "jose";

export interface SecretBindings {
  readonly CAPYRA_AUTH_SIGNING_KEY: string;
  readonly CAPYRA_FIREBASE_PROJECT_ID?: string;
  readonly CAPYRA_R2_ACCESS_KEY_ID: string;
  readonly CAPYRA_R2_SECRET_ACCESS_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly CAPYRA_SOCIAL_PROVIDER?: "mock" | "zernio";
  readonly ZERNIO_API_KEY?: string;
  readonly ZERNIO_WEBHOOK_SECRET?: string;
  readonly ZERNIO_API_BASE_URL?: string;
}

export type RuntimeEnv = Omit<Env, "CAPYRA_SOCIAL_PROVIDER" | "ZERNIO_API_BASE_URL"> & SecretBindings;

export interface AuthPrincipal extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  account_id: string;
  role: "owner" | "member";
  client_id?: string;
  scope?: string;
}

export type AppBindings = {
  Bindings: RuntimeEnv;
  Variables: {
    requestId: string;
    principal: AuthPrincipal;
  };
};

export type AppContext = Context<AppBindings>;
export type AppMiddleware = MiddlewareHandler<AppBindings>;

export interface AnalysisJobMessage {
  analysisId: string;
}

export interface SocialJobMessage {
  kind: "destination" | "webhook" | "sync" | "import" | "probe";
  id: string;
}
