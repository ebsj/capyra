import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = join(rootDir, "tmp", "security");
const severity = process.env.CAPYRA_SECURITY_SEVERITY ?? "HIGH,CRITICAL";
const trivyFsSkipDirs = [
  ".tmp",
  "tmp",
  "**/.next",
  "**/.venv",
  "**/node_modules",
];

const dockerImages = [
  {
    name: "ai",
    dockerfile: "Dockerfile.cloudflare",
    tag: "capyra-security-ai:local",
    cwd: join(rootDir, "apps", "ai"),
  },
];

const defaultZapTargets = [
  ["api", `http://${process.env.CAPYRA_SECURITY_HOST ?? "127.0.0.1"}:5080`],
  ["web", `http://${process.env.CAPYRA_SECURITY_HOST ?? "127.0.0.1"}:3000`],
  ["site", `http://${process.env.CAPYRA_SECURITY_HOST ?? "127.0.0.1"}:3001`],
  ["mcp", `http://${process.env.CAPYRA_SECURITY_HOST ?? "127.0.0.1"}:5090`],
];

const commandAliases = {
  fs: runLocalBaseline,
  local: runLocalBaseline,
  dependencies: runLocalBaseline,
  images: runImageBaseline,
  image: runImageBaseline,
  dast: runDastBaseline,
  zap: runDastBaseline,
  scope: printScopeChecklist,
  help: printHelp,
};

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const commandArgs = args.slice(1);
const continueOnError = commandArgs.includes("--continue-on-error");

if (!commandAliases[command]) {
  console.error(`Unknown security baseline command: ${command}`);
  printHelp();
  process.exitCode = 1;
} else {
  try {
    await commandAliases[command](commandArgs.filter((arg) => arg !== "--continue-on-error"));
  } catch (error) {
    console.error(`\n[security] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

async function runLocalBaseline() {
  await ensureReportDir();

  const steps = [
    ["gitleaks", runGitleaks],
    ["trivy fs", runTrivyFs],
    ["semgrep", runSemgrep],
    ["npm audit root workspaces", () => run("npm", ["audit", "--workspaces", "--omit=dev", "--audit-level=high"])],
    ["pip-audit ai", runPipAudit],
  ];

  await runSteps(steps);
}

async function runImageBaseline(args = []) {
  await ensureReportDir();
  const skipBuild = args.includes("--skip-build");
  const selected = valueAfter(args, "--image");
  const images = selected
    ? dockerImages.filter((image) => image.name === selected)
    : dockerImages;

  if (images.length === 0) {
    throw new Error(`No known Docker image matched '${selected}'.`);
  }

  await requireCommand("docker");

  const steps = [];
  for (const image of images) {
    if (!skipBuild) {
      steps.push([
        `docker build ${image.name}`,
        () => run("docker", ["build", "-f", image.dockerfile, "-t", image.tag, "."], { cwd: image.cwd }),
      ]);
    }

    steps.push([
      `trivy image ${image.name}`,
      () => runTrivy(["image", "--scanners", "vuln,misconfig", "--pkg-types", "os", "--severity", severity, "--exit-code", "1", image.tag]),
    ]);
  }

  await runSteps(steps);
}

async function runDastBaseline(args = []) {
  await ensureReportDir();
  await requireCommand("docker");

  const strict = args.includes("--strict");
  const targets = parseTargets(args);
  const zapReportDir = join(reportDir, "zap");
  await mkdir(zapReportDir, { recursive: true });

  const steps = targets.map(([name, target]) => [
    `zap baseline ${name}`,
    () => {
      const zapArgs = [
        "run",
        "--rm",
        "-v",
        `${zapReportDir}:/zap/wrk:rw`,
        "ghcr.io/zaproxy/zaproxy:stable",
        "zap-baseline.py",
        "-t",
        target,
        "-m",
        "3",
        "-r",
        `${name}.html`,
        "-w",
        `${name}.md`,
        "-J",
        `${name}.json`,
      ];

      if (!strict) {
        zapArgs.push("-I");
      }

      return run("docker", zapArgs);
    },
  ]);

  await runSteps(steps);
  console.log(`\n[security] ZAP reports written to ${zapReportDir}`);
}

async function runGitleaks() {
  const args = ["detect", "--no-git", "--source", ".", "--redact", "--max-target-megabytes", "5", "--config", ".gitleaks.toml"];
  if (await hasCommand("gitleaks")) {
    await run("gitleaks", args);
    return;
  }

  await requireCommand("docker");
  await run("docker", [
    "run",
    "--rm",
    "-v",
    `${rootDir}:/repo`,
    "-w",
    "/repo",
    "zricethezav/gitleaks:latest",
    ...args,
  ]);
}

async function runTrivyFs() {
  await runTrivy([
    "fs",
    "--scanners",
    "vuln,secret,misconfig",
    "--severity",
    severity,
    "--exit-code",
    "1",
    "--ignorefile",
    ".trivyignore.yaml",
    ...trivyFsSkipDirs.flatMap((dir) => ["--skip-dirs", dir]),
    ".",
  ]);
}

async function runTrivy(args) {
  const trivyArgs = [
    args[0],
    "--timeout",
    process.env.CAPYRA_SECURITY_TRIVY_TIMEOUT ?? "10m",
    ...args.slice(1),
  ];
  if (await hasCommand("trivy")) {
    await run("trivy", trivyArgs);
    return;
  }

  await requireCommand("docker");
  const dockerArgs = ["run", "--rm"];
  const trivyCacheDir = join(reportDir, "trivy-cache");
  await mkdir(trivyCacheDir, { recursive: true });
  dockerArgs.push("-v", `${trivyCacheDir}:/root/.cache/trivy`);
  if (args[0] === "image") {
    dockerArgs.push("-v", "/var/run/docker.sock:/var/run/docker.sock");
  }
  dockerArgs.push("-v", `${rootDir}:/repo`, "-w", "/repo", "ghcr.io/aquasecurity/trivy:latest", ...trivyArgs);
  await run("docker", dockerArgs);
}

async function runSemgrep() {
  const args = [
    "scan",
    "--exclude=**/.next/**",
    "--exclude=**/.venv/**",
    "--exclude=**/dist/**",
    "--exclude=**/node_modules/**",
    "--exclude=tmp/**",
    "--config=p/owasp-top-ten",
    "--config=p/secrets",
    "--config=p/typescript",
    "--config=p/python",
    ".",
  ];

  if (await hasCommand("semgrep")) {
    await run("semgrep", args);
    return;
  }

  await requireCommand("docker");
  await run("docker", [
    "run",
    "--rm",
    "-v",
    `${rootDir}:/src`,
    "-w",
    "/src",
    "--entrypoint",
    "semgrep",
    "semgrep/semgrep:latest",
    ...args,
  ]);
}

async function runPipAudit() {
  const requirementsPath = join(reportDir, "ai-requirements.txt");
  const uvEnv = {
    UV_CACHE_DIR: join(reportDir, "uv-cache"),
    UV_TOOL_DIR: join(reportDir, "uv-tools"),
  };
  await run("uv", [
    "export",
    "--frozen",
    "--no-dev",
    "--no-editable",
    "--no-emit-project",
    "--no-hashes",
    "--format",
    "requirements.txt",
    "--output-file",
    requirementsPath,
  ], { cwd: join(rootDir, "apps", "ai"), env: uvEnv });

  if (await hasCommand("pip-audit")) {
    await run("pip-audit", ["-r", requirementsPath]);
    return;
  }

  if (await hasCommand("uvx")) {
    await run("uvx", ["pip-audit", "-r", requirementsPath], { env: uvEnv });
    return;
  }

  try {
    await run("uv", ["x", "pip-audit", "-r", requirementsPath], { env: uvEnv });
  } catch (error) {
    throw new Error(
      `pip-audit is not installed and neither uvx nor 'uv x' could run it: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function runSteps(steps) {
  const failures = [];

  for (const [name, step] of steps) {
    console.log(`\n[security] Running ${name}`);
    try {
      await step();
    } catch (error) {
      if (!continueOnError) {
        throw error;
      }

      failures.push([name, error]);
      console.error(`[security] ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} security baseline step(s) failed.`);
  }
}

function parseTargets(args) {
  const submitted = args
    .filter((arg) => arg.startsWith("--target="))
    .map((arg) => arg.slice("--target=".length));

  if (submitted.length === 0) {
    return defaultZapTargets;
  }

  return submitted.map((value) => {
    const separator = value.indexOf("=");
    if (separator <= 0) {
      throw new Error(`Invalid --target value '${value}'. Use --target=name=https://example.test.`);
    }

    return [value.slice(0, separator), value.slice(separator + 1)];
  });
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return args[index + 1] ?? null;
}

async function ensureReportDir() {
  await mkdir(reportDir, { recursive: true });
}

async function requireCommand(command) {
  if (await hasCommand(command)) {
    return;
  }

  throw new Error(`Required command not found: ${command}`);
}

async function hasCommand(command) {
  const path = process.env.PATH ?? "";
  const candidates = path.split(":").filter(Boolean).map((entry) => join(entry, command));

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK);
      return true;
    } catch {
      // Continue searching PATH.
    }
  }

  return false;
}

async function run(command, args, options = {}) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: { ...process.env, ...(options.env ?? {}) },
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

async function printScopeChecklist() {
  const doc = await readFile(join(rootDir, "docs", "security-baseline.md"), "utf8");
  const marker = "## Escopo operacional";
  const start = doc.indexOf(marker);
  if (start === -1) {
    console.log(doc);
    return;
  }

  const end = doc.indexOf("\n## ", start + marker.length);
  console.log(doc.slice(start, end === -1 ? undefined : end).trim());
}

function printHelp() {
  console.log(`
Usage:
  node tools/security-baseline.mjs local [--continue-on-error]
  node tools/security-baseline.mjs images [--image ai] [--skip-build]
  node tools/security-baseline.mjs dast [--target=name=url] [--strict]
  node tools/security-baseline.mjs scope

Notes:
  - Reports are written under tmp/security.
  - Local DAST expects npm run dev:cloudflare to be running.
  - CAPYRA_SECURITY_SEVERITY defaults to HIGH,CRITICAL.
`);
}
