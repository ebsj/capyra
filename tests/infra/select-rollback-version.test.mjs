import assert from "node:assert/strict";
import test from "node:test";

import {
  selectRollbackVersion,
  selectRollbackVersionFromJson,
} from "../../infra/scripts/select-rollback-version.mjs";

test("selects the newest deployment from Wrangler oldest-to-newest output", () => {
  const versionId = selectRollbackVersion([
    {
      created_on: "2026-09-01T10:00:00.000Z",
      versions: [{ version_id: "old-version", percentage: 100 }],
    },
    {
      created_on: "2026-09-02T10:00:00.000Z",
      versions: [{ version_id: "new-version", percentage: 100 }],
    },
  ]);

  assert.equal(versionId, "new-version");
});

test("rejects an empty deployment list", () => {
  assert.throws(
    () => selectRollbackVersion([]),
    /No existing deployment is available/,
  );
});

test("rejects malformed Wrangler JSON", () => {
  assert.throws(
    () => selectRollbackVersionFromJson("not-json"),
    /not valid JSON/,
  );
});

test("rejects a latest deployment with split traffic", () => {
  assert.throws(
    () => selectRollbackVersion([
      {
        created_on: "2026-09-02T10:00:00.000Z",
        versions: [
          { version_id: "canary-version", percentage: 10 },
          { version_id: "stable-version", percentage: 90 },
        ],
      },
    ]),
    /exactly one version/,
  );
});
