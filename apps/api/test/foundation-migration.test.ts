import { applyD1Migrations, env } from "cloudflare:test";
import { expect, it } from "vitest";

it("expands a pre-Social account without assigning or rewriting legacy media and analyses", async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS.slice(0, 1));
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO accounts(id,display_name,account_type,created_at,updated_at) VALUES('legacy-account','Legacy Studio','agency','2025-01-01','2025-01-01')"
    ),
    env.DB.prepare(
      "INSERT INTO account_users(id,account_id,name,email,normalized_email,role,created_at,updated_at) VALUES('legacy-owner','legacy-account','Owner','old@example.com','OLD@EXAMPLE.COM','owner','2025-01-01','2025-01-01')"
    ),
    env.DB.prepare(
      "INSERT INTO source_assets(id,account_id,source_label,content_type,content_length,object_key,upload_status,created_at) VALUES('legacy-source','legacy-account','video.mp4','video/mp4',5,'source-assets/legacy/video.mp4','completed','2025-01-01')"
    ),
    env.DB.prepare(
      "INSERT INTO video_analyses(id,account_id,source_asset_id,status,source_type,source_label,language,catalog_version,selected_skill_ids_json,created_at,updated_at) VALUES('legacy-analysis','legacy-account','legacy-source','completed','owned_asset','video.mp4','pt-BR','v1','[]','2025-01-01','2025-01-01')"
    ),
  ]);
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  const brand = await env.DB.prepare(
    "SELECT name,time_zone,confirmed_at FROM brands WHERE account_id='legacy-account'"
  ).first();
  expect(brand).toEqual({
    name: "Legacy Studio",
    time_zone: "America/Recife",
    confirmed_at: null,
  });
  expect(
    await env.DB.prepare(
      "SELECT brand_id,status FROM video_analyses WHERE id='legacy-analysis'"
    ).first()
  ).toEqual({ brand_id: null, status: "completed" });
  expect(
    await env.DB.prepare(
      "SELECT brand_id,object_key FROM source_assets WHERE id='legacy-source'"
    ).first()
  ).toEqual({ brand_id: null, object_key: "source-assets/legacy/video.mp4" });
  expect(
    await env.DB.prepare(
      "SELECT analysis_limit,brand_limit,identity_limit,operator_limit FROM account_entitlements WHERE account_id='legacy-account'"
    ).first()
  ).toEqual({
    analysis_limit: 50,
    brand_limit: 5,
    identity_limit: 15,
    operator_limit: 5,
  });
  expect(
    (
      await env.DB.prepare(
        "SELECT COUNT(*) AS n FROM analysis_credit_reservations"
      ).first<{ n: number }>()
    )?.n
  ).toBe(0);
});
