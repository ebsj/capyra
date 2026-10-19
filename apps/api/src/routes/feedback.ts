import { Hono } from "hono";
import { z } from "zod";
import { ANALYSIS_SELECT, type AnalysisRow } from "../analyses";
import { principalOf, requireAuth } from "../auth";
import { ApiError, nowIso, uuidv7, validationError } from "../common";
import { requireActiveBrand } from "../foundations";
import { pythonReportSchema } from "../report";
import type { AppBindings } from "../runtime";

const feedback = new Hono<AppBindings>();
feedback.use("*", requireAuth);
feedback.use("*", async (c, next) => {
  if (principalOf(c).client_id) throw new ApiError(403, "first_party_required", "Feedback reactions are available only to the first-party web application.");
  await next();
});

interface FeedbackRow {
  id: string;
  feedback_item_key: string;
  feedback_item_kind: "recommendation";
  skill_id: string;
  item_index: number;
  reaction: "positive" | "negative" | null;
  comment: string | null;
  updated_at: string;
}

async function analysis(c: import("hono").Context<AppBindings>): Promise<AnalysisRow> {
  const principal = principalOf(c);
  const row = await c.env.DB.prepare(`${ANALYSIS_SELECT} WHERE id = ? AND account_id = ? AND deleted_at IS NULL`)
    .bind(c.req.param("id"), principal.account_id).first<AnalysisRow>();
  if (!row) throw new ApiError(404, "analysis_not_found", "The analysis was not found.");
  if (c.req.method !== "GET" && row.brand_id) await requireActiveBrand(c.env,principal.account_id,row.brand_id);
  return row;
}

feedback.get("/:id/feedback-reactions/mine", async (c) => {
  const row = await analysis(c);
  const principal = principalOf(c);
  const reactions = await c.env.DB.prepare(`SELECT id, feedback_item_key, feedback_item_kind, skill_id, item_index, reaction, comment, updated_at
    FROM feedback_reactions WHERE analysis_id = ? AND account_id = ? AND account_user_id = ? ORDER BY updated_at DESC`)
    .bind(row.id, principal.account_id, principal.sub).all<FeedbackRow>();
  return c.json({ items: reactions.results.map((item) => ({
    feedbackItemKey: item.feedback_item_key, feedbackItemKind: item.feedback_item_kind, skillId: item.skill_id,
    itemIndex: item.item_index, reaction: item.reaction, comment: item.comment, updatedAt: item.updated_at,
  })) });
});

const upsertSchema = z.object({
  feedbackItemKind: z.literal("recommendation"),
  skillId: z.enum(["content_strategy", "filming", "editing", "audio_music", "compliance"]),
  itemIndex: z.number().int().nonnegative(),
  reaction: z.enum(["positive", "negative"]).optional().nullable(),
  comment: z.string().trim().max(2_000).optional().nullable(),
}).strict().refine((value) => Boolean(value.reaction) || Boolean(value.comment), { message: "A reaction or comment is required." });

feedback.put("/:id/feedback-reactions/:feedbackItemKey", async (c) => {
  const parsed = upsertSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return validationError(c, parsed.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  const row = await analysis(c);
  if (row.status !== "completed" || !row.report_object_key) throw new ApiError(409, "analysis_not_completed", "Feedback requires a completed analysis.");
  const object = await c.env.STORAGE.get(row.report_object_key);
  if (!object) throw new ApiError(409, "analysis_report_missing", "The analysis report is unavailable.");
  const report = pythonReportSchema.parse(await object.json());
  const skill = report.executed_skills.find((item) => item.skill_id === parsed.data.skillId);
  const recommendation = skill?.recommendations[parsed.data.itemIndex];
  if (!recommendation) throw new ApiError(422, "feedback_item_not_found", "The recommendation does not exist in this analysis.");
  const expectedKey = `${parsed.data.feedbackItemKind}:${parsed.data.skillId}:${parsed.data.itemIndex}`;
  if (c.req.param("feedbackItemKey") !== expectedKey) throw new ApiError(422, "feedback_item_key_mismatch", "The feedbackItemKey does not match the request body.");
  const principal = principalOf(c);
  const timestamp = nowIso();
  await c.env.DB.prepare(`INSERT INTO feedback_reactions
    (id, analysis_id, account_id, account_user_id, feedback_item_key, feedback_item_kind, skill_id, item_index,
      title_snapshot, action_snapshot, rationale_snapshot, reaction, comment, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(analysis_id, account_user_id, feedback_item_key) DO UPDATE SET
      reaction = excluded.reaction, comment = excluded.comment, title_snapshot = excluded.title_snapshot,
      action_snapshot = excluded.action_snapshot, rationale_snapshot = excluded.rationale_snapshot, updated_at = excluded.updated_at`)
    .bind(uuidv7(), row.id, principal.account_id, principal.sub, expectedKey, parsed.data.feedbackItemKind, parsed.data.skillId,
      parsed.data.itemIndex, recommendation.title, recommendation.action, recommendation.rationale,
      parsed.data.reaction ?? null, parsed.data.comment || null, timestamp, timestamp).run();
  return c.json({ feedbackItemKey: expectedKey, feedbackItemKind: parsed.data.feedbackItemKind, skillId: parsed.data.skillId,
    itemIndex: parsed.data.itemIndex, reaction: parsed.data.reaction ?? null, comment: parsed.data.comment || null, updatedAt: timestamp });
});

feedback.delete("/:id/feedback-reactions/:feedbackItemKey", async (c) => {
  const row = await analysis(c);
  const principal = principalOf(c);
  await c.env.DB.prepare("DELETE FROM feedback_reactions WHERE analysis_id = ? AND account_id = ? AND account_user_id = ? AND feedback_item_key = ?")
    .bind(row.id, principal.account_id, principal.sub, c.req.param("feedbackItemKey")).run();
  return c.body(null, 204);
});

feedback.get("/:id/feedback-reactions/review", async (c) => {
  const row = await analysis(c);
  const principal = principalOf(c);
  if (principal.role !== "owner") throw new ApiError(403, "owner_required", "Only account owners can review feedback.");
  const limit = Math.min(Math.max(Number.parseInt(c.req.query("limit") ?? "50", 10) || 50, 1), 100);
  const result = await c.env.DB.prepare(`SELECT f.*, u.name AS tester_name, u.email AS tester_email
    FROM feedback_reactions f JOIN account_users u ON u.id = f.account_user_id
    WHERE f.analysis_id = ? AND f.account_id = ? ORDER BY f.updated_at DESC LIMIT ?`)
    .bind(row.id, principal.account_id, limit + 1).all<Record<string, unknown>>();
  const hasMore = result.results.length > limit;
  const items = result.results.slice(0, limit).map((item) => ({
    id: item.id, analysisId: row.id, analysisSummary: row.summary, sourceLabel: row.source_label,
    testerUserId: item.account_user_id, testerName: item.tester_name, testerEmail: item.tester_email,
    feedbackItemKey: item.feedback_item_key, feedbackItemKind: item.feedback_item_kind, skillId: item.skill_id,
    itemIndex: item.item_index, feedbackTitleSnapshot: item.title_snapshot, feedbackActionSnapshot: item.action_snapshot,
    feedbackRationaleSnapshot: item.rationale_snapshot, reaction: item.reaction, comment: item.comment,
    createdAt: item.created_at, updatedAt: item.updated_at,
  }));
  return c.json({ items, pagination: { limit, returned: items.length, hasMore, nextCursor: null } });
});

export default feedback;
