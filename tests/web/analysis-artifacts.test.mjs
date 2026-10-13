import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const source = readFileSync(new URL("../../apps/web/features/analyses/utils/analysis-artifact-utils.ts", import.meta.url), "utf8");
const { buildArtifactSections } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString("base64")}`);

test("groups every artifact including unknown categories", () => {
  const items = ["video", "frame", "audio", "report", "manifest", "other", "upload-id", ""].map((category, i) => ({category, path: String(i)}));
  const sections = buildArtifactSections(items);
  assert.equal(sections.flatMap(s => s.items).length, items.length);
  assert.deepEqual(sections.find(s => s.category === "other").items, items.slice(5));
});
test("empty state only for an empty list", () => {
  assert.deepEqual(buildArtifactSections([]), []);
  assert.equal(buildArtifactSections([{category:"unexpected", path:"file"}]).length, 1);
});
