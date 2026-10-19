import { contractErrors, contractSchemas } from "../contract-validation";
import { Hono } from "hono";
import { z } from "zod";
import { principalOf, requireAuth } from "../auth";
import { ApiError, nowIso, uuidv7 } from "../common";
import {
  currentUsageCycle,
  requireActiveBrand,
  requireOwner,
  recordAudit,
  notifyOwners,
} from "../foundations";
import type { AppBindings, AuthPrincipal } from "../runtime";
import { provider, ProviderError, SelectionRequired } from "../social/provider";
import {
  parseBody,
  payloadSchema,
  ownedAccount,
  ownedDestination,
  getPublication,
  validateReferences,
  preflight,
  submitDestination,
  hash,
} from "../social/publications";
import {
  cancelDestination,
  disconnectAccount,
  mutateDestination,
} from "../social/lifecycle";
import { enqueueSync } from "../social/analytics";
import { receiveWebhook } from "../social/webhooks";
import {
  accountDto,
  destinationDto,
  type SocialAccountRow,
  type SocialEnv,
} from "../social/types";

const routes = new Hono<AppBindings>();
export const publicSocialRoutes = new Hono<AppBindings>();
const envOf = (c: { env: unknown }) => c.env as SocialEnv;
async function boundary(
  c: import("hono").Context<AppBindings>,
  name: keyof typeof contractSchemas
) {
  const payload = await c.req.json().catch(() => null);
  const issues = contractErrors(contractSchemas[name], payload);
  if (issues.length)
    throw new ApiError(
      422,
      "validation_error",
      "Revise os campos informados.",
      { issues }
    );
  return payload;
}

publicSocialRoutes.post("/social-webhooks/zernio", async (c) => {
  await receiveWebhook(
    envOf(c),
    await c.req.text(),
    c.req.header("X-Zernio-Signature")
  );
  return c.json({ received: true });
});
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        s
      ]!)
  );
async function callback(c: import("hono").Context<AppBindings>) {
  const env = envOf(c);
  const query =
    c.req.method === "POST"
      ? new URLSearchParams(await c.req.text())
      : new URL(c.req.url).searchParams;
  const state = query.get("session") ?? "";
  const session = await env.DB.prepare(
    "SELECT * FROM social_authorizations WHERE state_hash=? AND used_at IS NULL AND expires_at>?"
  )
    .bind(await hash(state), nowIso())
    .first<{
      id: string;
      account_id: string;
      brand_id: string;
      actor_id: string;
      platform: SocialAccountRow["platform"];
      social_account_id: string;
      expected_identity: string | null;
    }>();
  if (!session)
    throw new ApiError(
      400,
      "social_session_invalid",
      "A autorização expirou ou já foi utilizada."
    );
  const actor = await env.DB.prepare(
    "SELECT id,email,name,role FROM account_users WHERE id=? AND account_id=? AND role='owner'"
  )
    .bind(session.actor_id, session.account_id)
    .first<{ id: string; email: string; name: string; role: "owner" }>();
  if (!actor)
    throw new ApiError(
      403,
      "social_actor_invalid",
      "O proprietário não está mais autorizado."
    );
  await requireActiveBrand(env, session.account_id, session.brand_id);
  const row = await ownedAccount(
    env,
    session.account_id,
    session.social_account_id
  );
  if (row.status === "disconnected" || !row.provider_profile_id)
    throw new ApiError(
      409,
      "social_session_invalid",
      "Esta conexão não está mais disponível."
    );
  const principal = {
    sub: actor.id,
    email: actor.email,
    name: actor.name,
    role: actor.role,
    account_id: session.account_id,
  } as AuthPrincipal;
  const claim = await env.DB.prepare(
    "UPDATE social_authorizations SET used_at=? WHERE id=? AND used_at IS NULL AND expires_at>?"
  )
    .bind(nowIso(), session.id, nowIso())
    .run();
  if (!claim.meta.changes)
    throw new ApiError(
      409,
      "social_session_reused",
      "Esta autorização já foi utilizada."
    );
  try {
    const remote = provider(env);
    const identity = await remote.complete(
      session.platform,
      row.provider_profile_id,
      query,
      session.expected_identity,
      async (native) => {
        if (session.expected_identity && session.expected_identity !== native)
          throw new ApiError(
            409,
            "social_identity_mismatch",
            "A reconexão deve usar a mesma identidade."
          );
        const cycle = await currentUsageCycle(env, session.account_id);
        try {
          await env.DB.batch([
            env.DB.prepare(
              "INSERT OR IGNORE INTO social_identity_usage VALUES(?,?,?,?,?)"
            ).bind(
              session.account_id,
              cycle.cycleStart,
              session.platform,
              native,
              nowIso()
            ),
            env.DB.prepare(
              "UPDATE social_accounts SET native_identity_id=?,identity_status='verified' WHERE id=? AND account_id=? AND status!='disconnected'"
            ).bind(native, row.id, session.account_id),
          ]);
        } catch {
          throw new ApiError(
            409,
            "social_identity_conflict",
            "A identidade já está conectada ou a franquia do ciclo foi atingida."
          );
        }
      }
    );
    await env.DB.prepare(
      "UPDATE social_accounts SET provider_account_id=?,display_name=?,native_identity_id=?,identity_status=?,status=?,updated_at=? WHERE id=? AND account_id=?"
    )
      .bind(
        identity.providerAccountId,
        identity.displayName,
        identity.nativeIdentityId,
        identity.nativeIdentityId ? "verified" : "unavailable",
        identity.nativeIdentityId ? "active" : "pending",
        nowIso(),
        row.id,
        session.account_id
      )
      .run();
    await recordAudit(
      env,
      principal,
      "social_account.connected",
      "social_account",
      row.id,
      row.brand_id
    );
    if (identity.nativeIdentityId)
      await enqueueSync(env, {
        ...row,
        status: "active",
        native_identity_id: identity.nativeIdentityId,
        identity_status: "verified",
        provider_account_id: identity.providerAccountId,
      });
    else
      await notifyOwners(
        env,
        row.account_id,
        row.brand_id,
        "social_identity_unverified",
        "A rede conectou, mas a identidade ainda não pode ser comprovada. Publicação permanece bloqueada.",
        row.id
      );
  } catch (error) {
    if (error instanceof SelectionRequired) {
      await env.DB.prepare(
        "UPDATE social_authorizations SET used_at=NULL WHERE id=?"
      )
        .bind(session.id)
        .run();
      const values = ["session", "tempToken", "connect_token"];
      const hidden = values
        .map(
          (key) =>
            `<input type="hidden" name="${key}" value="${escapeHtml(
              query.get(key) ?? ""
            )}">`
        )
        .join("");
      return c.html(
        `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Capyra · Selecionar Instagram</title><body><main><h1>Selecione a conta do Instagram</h1><p>Escolha a conta profissional desta Marca.</p><form method="post" action="/api/v1/social-connections/callback">${hidden}${error.pages
          .map(
            (p) =>
              `<p><button name="pageId" value="${escapeHtml(
                p.id
              )}">${escapeHtml(p.name)}</button></p>`
          )
          .join("")}</form></main></body></html>`,
        200,
        {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy":
            "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        }
      );
    }
    if (error instanceof ApiError) throw error;
    const code =
      error instanceof ProviderError
        ? error.code
        : "social_authorization_failed";
    await env.DB.prepare(
      "UPDATE social_authorizations SET used_at=? WHERE id=? AND used_at IS NULL"
    )
      .bind(nowIso(), session.id)
      .run();
    await notifyOwners(
      env,
      row.account_id,
      row.brand_id,
      code,
      "A conexão social não pôde ser concluída. Inicie uma nova autorização.",
      row.id
    );
    throw new ApiError(409, code, "A conexão social não pôde ser concluída.");
  }
  const origin = env.CAPYRA_WEB_BASE_URL || "http://localhost:3000";
  return c.redirect(`${origin}/brands/${session.brand_id}/connections`);
}
publicSocialRoutes.get("/social-connections/callback", callback);
publicSocialRoutes.post("/social-connections/callback", callback);
const isSocialPath = (path: string) =>
  /^\/api\/v1\/(?:brands\/[^/]+\/social-connections|social-connections|social-publications|external-posts|social-metrics)(?:\/|$)/.test(
    path
  );
routes.use("*", async (c, next) =>
  isSocialPath(c.req.path) ? requireAuth(c, next) : next()
);
routes.use("*", async (c, next) => {
  if (!isSocialPath(c.req.path)) return next();
  const p = principalOf(c);
  if (p.client_id)
    throw new ApiError(
      403,
      "social_interactive_only",
      "Use a interface Capyra para operações sociais."
    );
  if (c.req.method !== "GET") {
    for (const key of [
      `account:${p.account_id}`,
      `operator:${p.sub}`,
      `brand:${c.req.param("brandId") ?? p.account_id}`,
      `social:${c.req.param("id") ?? p.account_id}`,
    ]) {
      const result = await c.env.SOCIAL_RATE_LIMITER.limit({ key });
      if (!result.success)
        throw new ApiError(
          429,
          "social_rate_limited",
          "Aguarde antes de tentar novamente."
        );
    }
  }
  await next();
});
const platformSchema = z
  .object({
    platform: z.enum(["instagram", "tiktok", "youtube"]),
    reconnectAccountId: z.string().uuid().optional(),
  })
  .strict();
routes.get("/brands/:brandId/social-connections", async (c) => {
  const p = principalOf(c);
  const brand = await c.env.DB.prepare(
    "SELECT id FROM brands WHERE id=? AND account_id=?"
  )
    .bind(c.req.param("brandId"), p.account_id)
    .first();
  if (!brand)
    throw new ApiError(404, "brand_not_found", "Marca não encontrada.");
  const items = await c.env.DB.prepare(
    "SELECT * FROM social_accounts WHERE brand_id=? AND account_id=? ORDER BY created_at DESC"
  )
    .bind(c.req.param("brandId"), p.account_id)
    .all<SocialAccountRow>();
  return c.json({ items: items.results.map(accountDto) });
});
routes.post("/brands/:brandId/social-connections", async (c) => {
  const env = envOf(c),
    p = principalOf(c);
  requireOwner(p);
  const brand = await requireActiveBrand(
    env,
    p.account_id,
    c.req.param("brandId")
  );
  const input = parseBody(
    platformSchema,
    await boundary(c, "SocialAuthorizationRequest")
  );
  const remote = provider(env);
  const existing = await env.DB.prepare(
    "SELECT * FROM social_accounts WHERE account_id=? AND brand_id=? AND platform=? AND status!='disconnected'"
  )
    .bind(p.account_id, brand.id, input.platform)
    .first<SocialAccountRow>();
  if (existing && !input.reconnectAccountId)
    throw new ApiError(
      409,
      "social_slot_occupied",
      "Desconecte a identidade atual antes de trocar de conta."
    );
  if (
    input.reconnectAccountId &&
    (!existing || existing.id !== input.reconnectAccountId)
  )
    throw new ApiError(
      404,
      "social_account_not_found",
      "Conta social não encontrada."
    );
  if (
    existing &&
    (!existing.native_identity_id ||
      existing.identity_status !== "verified" ||
      (!remote.mock && existing.platform !== "instagram"))
  )
    throw new ApiError(
      409,
      "social_reconnection_unverified",
      "Esta reconexão exige comprovação de identidade e está bloqueada para preservar o histórico."
    );
  const now = nowIso();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO social_profiles(brand_id,request_key,created_at) VALUES(?,?,?)"
  )
    .bind(brand.id, uuidv7(), now)
    .run();
  const profile = await env.DB.prepare(
    "SELECT * FROM social_profiles WHERE brand_id=?"
  )
    .bind(brand.id)
    .first<{ provider_profile_id: string | null; request_key: string }>();
  let profileId = profile!.provider_profile_id;
  if (!profileId) {
    profileId = await remote.createProfile(brand.name, profile!.request_key);
    await env.DB.prepare(
      "UPDATE social_profiles SET provider_profile_id=? WHERE brand_id=? AND provider_profile_id IS NULL"
    )
      .bind(profileId, brand.id)
      .run();
  }
  const id = existing?.id ?? uuidv7();
  if (!existing) {
    try {
      await env.DB.prepare(
        "INSERT INTO social_accounts(id,account_id,brand_id,platform,provider_profile_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?)"
      )
        .bind(id, p.account_id, brand.id, input.platform, profileId, now, now)
        .run();
    } catch {
      throw new ApiError(
        409,
        "social_slot_occupied",
        "Outra conexão já está em andamento."
      );
    }
  }
  const state = crypto.randomUUID() + crypto.randomUUID(),
    sessionId = uuidv7(),
    expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
  await env.DB.prepare(
    "INSERT INTO social_authorizations(id,state_hash,account_id,brand_id,actor_id,platform,social_account_id,expected_identity,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      sessionId,
      await hash(state),
      p.account_id,
      brand.id,
      p.sub,
      input.platform,
      id,
      existing?.native_identity_id ?? null,
      expiresAt,
      now
    )
    .run();
  const callbackUrl = new URL(
    "/api/v1/social-connections/callback",
    env.CAPYRA_AUTH_ISSUER
  );
  callbackUrl.searchParams.set("session", state);
  const authorizationUrl = await remote.authorization(
    input.platform,
    profileId,
    callbackUrl.toString()
  );
  await recordAudit(
    env,
    p,
    "social_authorization.started",
    "social_account",
    id,
    brand.id
  );
  return c.json({ id: sessionId, authorizationUrl, expiresAt }, 201);
});
routes.post("/social-connections/:id/disconnect", async (c) => {
  const p = principalOf(c);
  requireOwner(p);
  const row = await ownedAccount(envOf(c), p.account_id, c.req.param("id"));
  await requireActiveBrand(c.env, p.account_id, row.brand_id);
  const result = await disconnectAccount(envOf(c), row);
  await recordAudit(
    c.env,
    p,
    "social_account.disconnect_requested",
    "social_account",
    row.id,
    row.brand_id
  );
  return c.json(
    accountDto(result),
    result.status === "disconnected" ? 200 : 202
  );
});
routes.get("/social-connections/:id/capabilities", async (c) => {
  const row = await ownedAccount(
    envOf(c),
    principalOf(c).account_id,
    c.req.param("id")
  );
  if (!row.provider_account_id)
    throw new ApiError(409, "social_connection_pending", "Conclua a conexão.");
  return c.json(await provider(envOf(c)).capabilities(row));
});
routes.post("/social-connections/:id/sync", async (c) => {
  const row = await ownedAccount(
    envOf(c),
    principalOf(c).account_id,
    c.req.param("id")
  );
  await requireActiveBrand(c.env, row.account_id, row.brand_id);
  await enqueueSync(envOf(c), row);
  return c.json({ status: "pending" }, 202);
});
function page(query: (key: string) => string | undefined) {
  const limit = Math.min(100, Math.max(1, Number(query("limit")) || 20));
  let cursor = "";
  try {
    cursor = query("cursor") ? atob(query("cursor")!) : "";
  } catch {
    throw new ApiError(400, "invalid_cursor", "Cursor inválido.");
  }
  return { limit, cursor };
}
async function checkBrand(
  c: import("hono").Context<AppBindings>,
  brandId: string | undefined
) {
  if (
    !brandId ||
    !(await c.env.DB.prepare(
      "SELECT id FROM brands WHERE id=? AND account_id=?"
    )
      .bind(brandId, principalOf(c).account_id)
      .first())
  )
    throw new ApiError(404, "brand_not_found", "Marca não encontrada.");
  return brandId;
}
routes.get("/social-publications", async (c) => {
  const p = principalOf(c),
    brand = await checkBrand(c, c.req.query("brandId"));
  const { limit, cursor } = page((k) => c.req.query(k));
  const rows = await c.env.DB.prepare(
    "SELECT id FROM social_publications WHERE account_id=? AND brand_id=? AND (?='' OR id<?) ORDER BY id DESC LIMIT ?"
  )
    .bind(p.account_id, brand, cursor, cursor, limit + 1)
    .all<{ id: string }>();
  const slice = rows.results.slice(0, limit);
  return c.json({
    items: await Promise.all(
      slice.map((r) => getPublication(envOf(c), p.account_id, r.id))
    ),
    ...(rows.results.length > limit
      ? { nextCursor: btoa(slice.at(-1)!.id) }
      : {}),
  });
});
routes.post("/social-publications", async (c) => {
  const p = principalOf(c);
  const body = parseBody(
    z
      .object({
        brandId: z.string().uuid(),
        title: z.string().trim().min(1).max(160),
      })
      .strict(),
    await boundary(c, "SocialPublicationCreate")
  );
  await requireActiveBrand(c.env, p.account_id, body.brandId);
  const id = uuidv7(),
    now = nowIso();
  await c.env.DB.prepare("INSERT INTO social_publications VALUES(?,?,?,?,?,?)")
    .bind(id, p.account_id, body.brandId, body.title, now, now)
    .run();
  await recordAudit(
    c.env,
    p,
    "publication.created",
    "social_publication",
    id,
    body.brandId
  );
  return c.json(await getPublication(envOf(c), p.account_id, id), 201);
});
routes.get("/social-publications/:id", async (c) =>
  c.json(
    await getPublication(envOf(c), principalOf(c).account_id, c.req.param("id"))
  )
);
routes.post("/social-publications/:id/destinations", async (c) => {
  const p = principalOf(c),
    publication = await getPublication(
      envOf(c),
      p.account_id,
      c.req.param("id")
    );
  await requireActiveBrand(c.env, p.account_id, publication.brandId);
  const payload = parseBody(
    payloadSchema,
    await boundary(c, "SocialDestinationInput")
  );
  const { account } = await validateReferences(
    envOf(c),
    p.account_id,
    publication.brandId,
    payload
  );
  const id = uuidv7(),
    now = nowIso();
  await c.env.DB.prepare(
    "INSERT INTO social_destinations(id,account_id,brand_id,publication_id,social_account_id,platform,payload_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)"
  )
    .bind(
      id,
      p.account_id,
      publication.brandId,
      publication.id,
      account.id,
      account.platform,
      JSON.stringify(payload),
      now,
      now
    )
    .run();
  await recordAudit(
    c.env,
    p,
    "destination.created",
    "social_destination",
    id,
    publication.brandId
  );
  return c.json(
    destinationDto(await ownedDestination(envOf(c), p.account_id, id)),
    201
  );
});
routes.patch(
  "/social-publications/:id/destinations/:destinationId",
  async (c) => {
    const p = principalOf(c);
    let row = await ownedDestination(
      envOf(c),
      p.account_id,
      c.req.param("destinationId"),
      c.req.param("id")
    );
    await requireActiveBrand(c.env, p.account_id, row.brand_id);
    const payload = parseBody(
      payloadSchema,
      await boundary(c, "SocialDestinationInput")
    );
    const { account } = await validateReferences(
      envOf(c),
      p.account_id,
      row.brand_id,
      payload
    );
    if (["awaiting_handoff", "scheduled"].includes(row.status))
      row = await cancelDestination(envOf(c), row);
    if (!["draft", "cancelled", "failed"].includes(row.status))
      throw new ApiError(
        409,
        "destination_not_editable",
        "Aguarde o cancelamento confirmado para editar."
      );
    const result = await c.env.DB.prepare(
      "UPDATE social_destinations SET payload_json=?,social_account_id=?,platform=?,status='draft',current_version_id=NULL,scheduled_at=NULL,last_error=NULL,updated_at=? WHERE id=? AND account_id=? AND status=? AND updated_at=?"
    )
      .bind(
        JSON.stringify(payload),
        account.id,
        account.platform,
        nowIso(),
        row.id,
        p.account_id,
        row.status,
        row.updated_at
      )
      .run();
    if (!result.meta.changes)
      throw new ApiError(
        409,
        "destination_state_conflict",
        "O destino foi alterado."
      );
    await recordAudit(
      c.env,
      p,
      "destination.updated",
      "social_destination",
      row.id,
      row.brand_id
    );
    return c.json(
      destinationDto(await ownedDestination(envOf(c), p.account_id, row.id))
    );
  }
);
routes.post(
  "/social-publications/:id/destinations/:destinationId/preflight",
  async (c) => {
    const row = await ownedDestination(
      envOf(c),
      principalOf(c).account_id,
      c.req.param("destinationId"),
      c.req.param("id")
    );
    await requireActiveBrand(c.env, row.account_id, row.brand_id);
    return c.json(await preflight(envOf(c), row));
  }
);
routes.post(
  "/social-publications/:id/destinations/:destinationId/submit",
  async (c) => {
    const p = principalOf(c),
      row = await ownedDestination(
        envOf(c),
        p.account_id,
        c.req.param("destinationId"),
        c.req.param("id")
      );
    const body = parseBody(
      z
        .object({
          publishNow: z.boolean(),
          localDateTime: z.string().optional(),
        })
        .strict(),
      await boundary(c, "SocialSubmit")
    );
    return c.json(
      await submitDestination(
        envOf(c),
        p,
        row,
        c.req.header("Idempotency-Key") ?? "",
        body
      ),
      202
    );
  }
);
for (const action of ["cancel", "retry"] as const)
  routes.post(
    `/social-publications/:id/destinations/:destinationId/${action}`,
    async (c) => {
      const p = principalOf(c),
        row = await ownedDestination(
          envOf(c),
          p.account_id,
          c.req.param("destinationId"),
          c.req.param("id")
        );
      await requireActiveBrand(c.env, p.account_id, row.brand_id);
      return c.json(
        await mutateDestination(
          envOf(c),
          p,
          row,
          action,
          c.req.header("Idempotency-Key") ?? ""
        ),
        202
      );
    }
  );
routes.get("/external-posts", async (c) => {
  const brand = await checkBrand(c, c.req.query("brandId"));
  const { limit, cursor } = page((k) => c.req.query(k));
  const rows = await c.env.DB.prepare(
    "SELECT id,brand_id,social_account_id,platform,native_post_id,url,content,published_at FROM external_posts WHERE account_id=? AND brand_id=? AND (?='' OR id<?) ORDER BY id DESC LIMIT ?"
  )
    .bind(principalOf(c).account_id, brand, cursor, cursor, limit + 1)
    .all<Record<string, unknown>>();
  const slice = rows.results.slice(0, limit);
  return c.json({
    items: slice.map((r) => ({
      id: r.id,
      brandId: r.brand_id,
      socialAccountId: r.social_account_id,
      platform: r.platform,
      nativePostId: r.native_post_id,
      url: r.url,
      content: r.content,
      publishedAt: r.published_at,
    })),
    ...(rows.results.length > limit
      ? { nextCursor: btoa(String(slice.at(-1)!.id)) }
      : {}),
  });
});
routes.post("/external-posts/import", async (c) => {
  const p = principalOf(c),
    body = parseBody(
      z
        .object({
          socialAccountId: z.string().uuid(),
          url: z.string().url().max(2048),
        })
        .strict(),
      await boundary(c, "ExternalPostImport")
    );
  const row = await ownedAccount(envOf(c), p.account_id, body.socialAccountId);
  await requireActiveBrand(c.env, p.account_id, row.brand_id);
  await enqueueSync(envOf(c), row, body.url);
  await recordAudit(
    c.env,
    p,
    "external_post.import_requested",
    "social_account",
    row.id,
    row.brand_id
  );
  return c.json({ status: "pending" }, 202);
});
routes.get("/social-metrics", async (c) => {
  const brand = await checkBrand(c, c.req.query("brandId"));
  const { limit, cursor } = page((k) => c.req.query(k));
  const accountId = principalOf(c).account_id;
  const filters = ["socialAccountId", "destinationId", "metric"].map(
    (k) => c.req.query(k) || ""
  );
  const rows = await c.env.DB.prepare(
    "SELECT * FROM metric_snapshots WHERE account_id=? AND brand_id=? AND (?='' OR id<?) AND (?='' OR social_account_id=?) AND (?='' OR destination_id=?) AND (?='' OR metric=?) ORDER BY id DESC LIMIT ?"
  )
    .bind(
      accountId,
      brand,
      cursor,
      cursor,
      ...filters.flatMap((f) => [f, f]),
      limit + 1
    )
    .all<Record<string, unknown>>();
  const slice = rows.results.slice(0, limit);
  return c.json({
    items: slice.map((r) => ({
      id: r.id,
      brandId: r.brand_id,
      socialAccountId: r.social_account_id,
      destinationId: r.destination_id,
      externalPostId: r.external_post_id,
      platform: r.platform,
      metric: r.metric,
      value: r.value,
      availability: r.availability,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      observedAt: r.observed_at,
      dataThrough: r.data_through,
      source: r.source,
    })),
    ...(rows.results.length > limit
      ? { nextCursor: btoa(String(slice.at(-1)!.id)) }
      : {}),
  });
});
export default routes;
