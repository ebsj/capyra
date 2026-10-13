import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { requestId } from "hono/request-id";
import authRoutes from "./routes/auth";
import assetRoutes from "./routes/assets";
import analysisRoutes from "./routes/analyses";
import oauthRoutes from "./routes/oauth";
import uploadSessionRoutes from "./routes/upload-sessions";
import feedbackRoutes from "./routes/feedback";
import foundationRoutes, { reconcileBrandArchives } from "./routes/foundations";
import socialRoutes, { publicSocialRoutes } from "./routes/social";
import { consumeSocialMessage, markSocialDlqFailure, reconcileSocial, syncSocialMetrics } from "./social/worker";
import { consumeMediaProbe, markMediaProbeFailure, reconcileMediaProbes } from "./media-probe";
import { purgeFoundationRecords } from "./foundations";
import { ApiError, errorResponse, nowIso, uuidv7 } from "./common";
import { AnalysisContainer, consumeAnalysisMessage, containerHealth, markDlqFailure, purgeExpired, reconcile } from "./processor";
import { handleLocalUpload } from "./r2";
import type { AnalysisJobMessage, SocialJobMessage, AppBindings, RuntimeEnv } from "./runtime";

export { AnalysisContainer };
export { ContainerProxy } from "@cloudflare/containers";

const app = new Hono<AppBindings>();
app.use("*", requestId({ headerName: "X-Request-Id", generator: uuidv7 }));
app.use("*", async (c, next) => {
  c.set("requestId", c.get("requestId") || uuidv7());
  const startedAt = Date.now();
  await next();
  console.log(JSON.stringify({
    event: "http_request",
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  }));
});
app.use("*", secureHeaders({
  crossOriginResourcePolicy: "same-site",
  referrerPolicy: "no-referrer",
  xFrameOptions: "DENY",
}));
app.use("/api/v1/*", cors({
  origin: (origin, c) => origin === c.env.CAPYRA_WEB_BASE_URL || origin === "https://capyra.co" ? origin : "",
  allowHeaders: ["Authorization", "Content-Type", "X-Request-Id", "Idempotency-Key"],
  exposeHeaders: ["Content-Length", "Content-Range", "ETag", "X-Request-Id", "Retry-After"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  maxAge: 86_400,
}));

app.get("/", (c) => c.json({ name: "Capyra API", version: "v1", runtime: "cloudflare-workers" }));
app.get("/api/v1/health", (c) => c.json({ status: "ok", timestamp: nowIso() }));
app.options("/__dev/r2-upload", (c) => {
  if (String(c.env.CAPYRA_ENVIRONMENT) !== "local") return c.body(null, 404);
  return c.body(null, 204, {
    "Access-Control-Allow-Origin": c.env.CAPYRA_WEB_BASE_URL,
    "Access-Control-Allow-Methods": "PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  });
});
app.put("/__dev/r2-upload", async (c) => {
  if (String(c.env.CAPYRA_ENVIRONMENT) !== "local") return c.body(null, 404);
  const response = await handleLocalUpload(c.req.raw, c.env);
  response.headers.set("Access-Control-Allow-Origin", c.env.CAPYRA_WEB_BASE_URL);
  return response;
});
app.get("/__dev/container-health", async (c) => {
  if (String(c.env.CAPYRA_ENVIRONMENT) !== "local") return c.body(null, 404);
  const response = await containerHealth(c.env);
  return new Response(response.body, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
});
app.route("/api/v1", publicSocialRoutes);
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1/oauth", oauthRoutes);
app.route("/api/v1/integrations/source-asset-sessions", uploadSessionRoutes);
app.route("/api/v1/source-assets", assetRoutes);
app.route("/api/v1", analysisRoutes);
app.route("/api/v1/analyses", feedbackRoutes);
app.route("/api/v1", socialRoutes);
app.route("/api/v1", foundationRoutes);

app.notFound((c) => c.json({ code: "not_found", message: "The requested resource was not found.", traceId: c.get("requestId") }, 404));
app.onError((error, c) => {
  if (error instanceof ApiError) return errorResponse(c, error);
  console.error(JSON.stringify({ event: "unhandled_error", requestId: c.get("requestId"), errorType: error instanceof Error ? error.name : "UnknownError" }));
  return errorResponse(c, new ApiError(500, "internal_server_error", "Internal server error."));
});

const worker: ExportedHandler<RuntimeEnv, AnalysisJobMessage | SocialJobMessage> = {
  fetch: (request, env, ctx) => app.fetch(request, env, ctx),
  async queue(batch, env) {
    const social = batch.queue === "capyra-social" || batch.queue === "capyra-social-dlq";
    const analysis = batch.queue === "capyra-analyses" || batch.queue === "capyra-analyses-dlq";
    if (!social && !analysis) throw new Error("Unrecognized queue binding");
    const isDlq = batch.queue.endsWith("-dlq");
    for (const message of batch.messages) {
      try {
        if (social) {
          const socialMessage = message as Message<SocialJobMessage>;
          if (socialMessage.body.kind === "probe") {
            if (isDlq) await markMediaProbeFailure(env, socialMessage.body.id);
            else await consumeMediaProbe(env, socialMessage);
          } else if (isDlq) await markSocialDlqFailure(env, socialMessage.body);
          else await consumeSocialMessage(env, socialMessage.body);
        } else {
          const analysisMessage = message as Message<AnalysisJobMessage>;
          if (isDlq) await markDlqFailure(env, analysisMessage);
          else await consumeAnalysisMessage(env, analysisMessage);
        }
        message.ack();
      } catch (error) {
        console.error(JSON.stringify({event: social ? "social_job_failed" : "analysis_job_failed", attempts: message.attempts, errorType: error instanceof Error ? error.name : "UnknownError"}));
        message.retry({ delaySeconds: Math.min(300, 2 ** message.attempts * 5) });
      }
    }
  },
  async scheduled(controller, env, ctx) {
    if (controller.cron === "17 3 * * *") {
      ctx.waitUntil(Promise.all([purgeExpired(env), purgeFoundationRecords(env), syncSocialMetrics(env)]));
    } else {
      ctx.waitUntil(Promise.all([reconcile(env), reconcileSocial(env), reconcileMediaProbes(env), reconcileBrandArchives(env)]));
    }
  },
};

export default worker;
