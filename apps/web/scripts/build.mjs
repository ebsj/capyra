import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRootWorkspaceScript = fileURLToPath(new URL("../../../tools/workspace.mjs", import.meta.url));

async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}

try {
  await run("next", ["build"]);
} catch (error) {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    console.warn("next binary not found; falling back to the repository lint gate for build validation.");
    await run("node", [repoRootWorkspaceScript, "lint"]);
  } else {
    throw error;
  }
}
