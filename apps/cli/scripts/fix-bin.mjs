import { chmod, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.cwd(), "dist/cli.js");
const shebang = "#!/usr/bin/env node\n";
const source = await readFile(target, "utf8");

if (!source.startsWith(shebang)) {
  await writeFile(target, `${shebang}${source}`, "utf8");
}

await chmod(target, 0o755);
