import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serverSource = await readFile(new URL("./server.ts", import.meta.url), "utf8");

test("MCP registers list_latest_analyses with safe defaults and non-empty guidance", () => {
  assert.match(serverSource, /"list_latest_analyses"/);
  assert.match(serverSource, /latestAnalysesLimitSchema = z\.number\(\)\.int\(\)\.min\(1\)\.max\(50\)\.default\(10\)/);
  assert.match(serverSource, /includeSummary: z\.boolean\(\)\.default\(true\)/);
  assert.match(serverSource, /includeSkillDetails: z\.boolean\(\)\.default\(false\)/);
  assert.match(serverSource, /do not say that no analyses were found/i);
  assert.match(serverSource, /client\.listLatestAnalyses/);
});

test("MCP keeps raw list_analyses separate from latest conversational routing", () => {
  assert.match(serverSource, /"list_analyses"/);
  assert.match(serverSource, /prefer list_latest_analyses/i);
  assert.match(serverSource, /const analyses = await client\.listAnalyses\(\)/);
});

test("MCP registers summarize_analyses table and brief formats without detail fetching", () => {
  assert.match(serverSource, /"summarize_analyses"/);
  assert.match(serverSource, /z\.enum\(\["table", "brief", "detailed"\]\)\.default\("table"\)/);
  assert.match(serverSource, /itemsUsed/);
  assert.match(serverSource, /includeSkillDetails: format === "detailed"/);
});

test("MCP does not advertise compliance as a selectable create-analysis skill", () => {
  assert.match(serverSource, /"list_analysis_skills"/);
  assert.match(serverSource, /currently published\/selectable Capyra analysis skills/);
  assert.match(serverSource, /analysisSkillsInputSchema/);
  assert.match(serverSource, /Published skill id from list_analysis_skills/);
  assert.doesNotMatch(serverSource, /ANALYSIS_SKILLS\s*=\s*\[[\s\S]*"compliance"/);
  assert.doesNotMatch(serverSource, /skills:\s*z\.array\(z\.enum\(/);
});

test("MCP resolves default all and recommended skills from the published API catalog", () => {
  assert.match(serverSource, /async function resolveSkillSelection/);
  assert.match(serverSource, /client\.getAnalysisSkills\(\)/);
  assert.match(serverSource, /item\.status === "published"/);
  assert.match(serverSource, /skill === "all" \|\| skill === "recommended"/);
});

test("MCP returns structured temporary unavailable result for stale compliance requests", () => {
  assert.match(serverSource, /TEMPORARILY_UNAVAILABLE_SKILLS = \["compliance"\]/);
  assert.match(serverSource, /skill_temporarily_unavailable/);
  assert.match(serverSource, /analysisCreated: false/);
  assert.match(serverSource, /return skillSelection\.result/);
  assert.match(serverSource, /client\.createAnalysisFromUrl/);
  assert.match(serverSource, /client\.createAnalysisFromSourceAsset/);
});
