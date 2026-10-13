import { spawn } from "node:child_process";
import { constants, existsSync } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(rootDir, "skills");
const skills = [
  "capyra-security-dast",
  "capyra-security-images",
  "capyra-security-local",
  "capyra-security-remediate",
];
const quickValidate = resolveQuickValidatePath();

for (const skillName of skills) {
  const skillDir = join(skillsDir, skillName);
  await validateStructure(skillName, skillDir);

  if (quickValidate) {
    await run("python3", [quickValidate, skillDir]);
  }
}

console.log(`[skills] Validated ${skills.length} Capyra security skill(s).`);

async function validateStructure(skillName, skillDir) {
  const skillPath = join(skillDir, "SKILL.md");
  const openaiPath = join(skillDir, "agents", "openai.yaml");
  await requireReadable(skillPath);
  await requireReadable(openaiPath);

  const skill = await readFile(skillPath, "utf8");
  if (!skill.startsWith("---\n")) {
    throw new Error(`${skillPath} is missing YAML frontmatter.`);
  }

  const frontmatterEnd = skill.indexOf("\n---", 4);
  if (frontmatterEnd === -1) {
    throw new Error(`${skillPath} has unterminated YAML frontmatter.`);
  }

  const frontmatter = skill.slice(4, frontmatterEnd);
  if (!frontmatter.includes(`name: ${skillName}`)) {
    throw new Error(`${skillPath} frontmatter name must be ${skillName}.`);
  }

  if (!/^description:\s+\S/m.test(frontmatter)) {
    throw new Error(`${skillPath} frontmatter description is required.`);
  }

  const openai = await readFile(openaiPath, "utf8");
  for (const marker of ["display_name:", "short_description:", "default_prompt:"]) {
    if (!openai.includes(marker)) {
      throw new Error(`${openaiPath} is missing ${marker}`);
    }
  }
}

async function requireReadable(path) {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`Required skill file is missing: ${path}`);
  }
}

function resolveQuickValidatePath() {
  const codexHome = process.env.CODEX_HOME ?? (process.env.HOME ? join(process.env.HOME, ".codex") : null);
  if (!codexHome) {
    return null;
  }

  const candidate = join(codexHome, "skills", ".system", "skill-creator", "scripts", "quick_validate.py");
  return existsSync(candidate) ? candidate : null;
}

async function run(command, args) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}
