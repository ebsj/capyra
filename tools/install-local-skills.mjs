import { constants } from "node:fs";
import { access, cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(rootDir, "skills");
const targetRoot = resolve(
  process.env.CODEX_HOME
    ? join(process.env.CODEX_HOME, "skills")
    : join(process.env.HOME ?? "", ".codex", "skills"),
);
const dryRun = process.argv.includes("--dry-run");
const skills = [
  "capyra-security-dast",
  "capyra-security-images",
  "capyra-security-local",
  "capyra-security-remediate",
];

if (!process.env.CODEX_HOME && !process.env.HOME) {
  throw new Error("HOME or CODEX_HOME must be set to install local skills.");
}

console.log(`[skills] Source: ${sourceDir}`);
console.log(`[skills] Target: ${targetRoot}`);
console.log(`[skills] Mode: ${dryRun ? "dry run" : "install"}`);

if (!dryRun) {
  await mkdir(targetRoot, { recursive: true });
}

for (const skillName of skills) {
  const source = join(sourceDir, skillName);
  const target = join(targetRoot, skillName);
  await requireSkillFile(source, "SKILL.md");
  await requireSkillFile(source, join("agents", "openai.yaml"));

  if (dryRun) {
    console.log(`[skills] Would install ${skillName} -> ${target}`);
    continue;
  }

  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true, force: true, errorOnExist: false });
  console.log(`[skills] Installed ${skillName}`);
}

async function requireSkillFile(skillDir, relativePath) {
  const path = join(skillDir, relativePath);
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`Required skill file is missing: ${path}`);
  }
}
