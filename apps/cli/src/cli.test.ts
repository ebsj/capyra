import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliSource = await readFile(new URL("./cli.ts", import.meta.url), "utf8");

test("CLI registers analyses latest while preserving analyses list raw behavior", () => {
  assert.match(cliSource, /\.command\("list"\)/);
  assert.match(cliSource, /client\.listAnalyses\(\)/);
  assert.match(cliSource, /\.command\("latest"\)/);
  assert.match(cliSource, /client\.listLatestAnalyses/);
  assert.match(cliSource, /includePresentation: globals\.format === "human"/);
});

test("CLI latest command validates JSON-compatible default and human renderer", () => {
  assert.match(cliSource, /type AnalysisLatestOptions/);
  assert.match(cliSource, /renderLatestAnalyses/);
  assert.match(cliSource, /--limit <limit>/);
  assert.match(cliSource, /--cursor <cursor>/);
});


test("CLI rejects analysis creation and upload without explicit Brand before authentication", () => {
  for (const args of [["analyses", "create", "--url", "https://example.test/video"], ["assets", "upload", "video.mp4"]]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(new URL("./cli.ts", import.meta.url)), ...args], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /brand-id/);
  }
});
