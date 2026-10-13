import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";

const command = process.argv[2] ?? "help";
const commands = { lint, build, test, help };

if (!commands[command]) {
  console.error(`Unknown workspace command: ${command}`);
  help();
  process.exitCode = 1;
} else {
  await commands[command]();
}

async function lint() {
  const required = [
    "apps/api/src/index.ts",
    "apps/api/migrations/0000_cloudflare_v2.sql",
    "apps/api/wrangler.jsonc",
    "apps/ai/Dockerfile.cloudflare",
    "apps/web/vite.config.ts",
    "apps/web/wrangler.jsonc",
    "apps/site/vite.config.ts",
    "apps/site/wrangler.jsonc",
    "apps/mcp/wrangler.jsonc",
    "contracts/openapi/capyra-api.v1.yaml",
    "contracts/schemas/analysis-report.v1.json",
    "infra/scripts/dev-cloudflare.sh",
    "infra/scripts/deploy-production.sh",
    "infra/scripts/check-production-config.mjs",
    "infra/scripts/select-rollback-version.mjs",
    "infra/scripts/smoke-production.sh",
    "infra/scripts/smoke-production-analysis.mjs",
    ".github/workflows/cloudflare-production.yml",
  ];
  for (const file of required) await access(new URL(`../${file}`, import.meta.url), constants.R_OK);

  for (const removed of ["Capyra.sln", "compose.yaml", "global.json", "contracts/dotnet/Capyra.Contracts/Capyra.Contracts.csproj", "infra/sql/bootstrap-local.sql"]) {
    await assertMissing(removed);
  }

  const openApi = await readFile(new URL("../contracts/openapi/capyra-api.v1.yaml", import.meta.url), "utf8");
  for (const route of ["/api/v1/health", "/api/v1/auth/register", "/api/v1/oauth/token", "/api/v1/source-assets/direct-uploads", "/api/v1/analyses/{id}"]) {
    if (!openApi.includes(route)) throw new Error(`OpenAPI contract missing ${route}.`);
  }

  const apiConfig = await readFile(new URL("../apps/api/wrangler.jsonc", import.meta.url), "utf8");
  for (const marker of ["capyra-analyses-dlq", '"max_instances": 2', '"instance_type": "basic"', '"max_concurrency": 2', '"secrets"', '"OPENAI_API_KEY"']) {
    if (!apiConfig.includes(marker)) throw new Error(`API Wrangler config missing ${marker}.`);
  }

  await validateMarkdownLinks();
  console.log("Workspace lint checks passed.");
}

async function build() {
  await run("npm", ["run", "check:cloudflare"]);
}

async function test() {
  await run("npm", ["run", "test"]);
  await run("node", ["--test", "tests/web/smoke.test.mjs"]);
  await run("node", ["--test", "tests/web/analysis-language.test.mjs"]);
}

async function assertMissing(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Legacy runtime path was reintroduced: ${path}.`);
}

async function validateMarkdownLinks() {
  const markdownFiles = (await capture("git", ["ls-files", "*.md"]))
    .split("\n").map((file) => file.trim()).filter(Boolean);
  for (const file of markdownFiles) {
    const fileUrl = new URL(`../${file}`, import.meta.url);
    let markdown;
    try { markdown = await readFile(fileUrl, "utf8"); }
    catch (error) { if (error?.code === "ENOENT") continue; throw error; }
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      let target = match[1].trim().split("#", 1)[0];
      if (!target || /^(https?:|mailto:)/.test(target)) continue;
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      try { await access(new URL(target, fileUrl), constants.R_OK); }
      catch { throw new Error(`Broken Markdown link in ${file}: ${match[1]}`); }
    }
  }
}

async function capture(executable, args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "inherit"], shell: false });
    let output = "";
    child.stdout.on("data", (chunk) => output += chunk);
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`${executable} exited with code ${code ?? "unknown"}`)));
  });
}

async function run(executable, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: "inherit", shell: false });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${executable} exited with code ${code ?? "unknown"}`)));
  });
}

function help() {
  console.log("Usage: node tools/workspace.mjs lint|build|test");
}
