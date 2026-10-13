#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export function buildProvisionSql(values, now = new Date().toISOString()) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(values["account-id"] ?? "") || !uuid.test(values["idempotency-key"] ?? "")) {
    throw new Error("--account-id and --idempotency-key must be UUIDs.");
  }
  const amount = (name) => {
    const value = values[name] ?? "0";
    if (!/^\d+$/.test(value) || Number(value) > 1000) throw new Error(`--${name} must be an integer from 0 to 1000.`);
    return Number(value);
  };
  const brands = amount("add-brands"), packs = amount("analysis-packs");
  const status = values.subscription ?? null;
  if (status !== null && !["active", "inactive"].includes(status)) throw new Error("--subscription must be active or inactive.");
  if (!brands && !packs && status === null) throw new Error("Choose at least one entitlement change.");
  const reason = values.reason?.trim();
  if (!reason || reason.length > 500) throw new Error("--reason must have 1–500 characters.");
  const quote = (value) => value === null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
  return `INSERT OR IGNORE INTO social_provisioning_operations\n(idempotency_key,account_id,add_brands,analysis_packs,subscription_status,reason,created_at)\nVALUES(${quote(values["idempotency-key"])},${quote(values["account-id"])},${brands},${packs},${quote(status)},${quote(reason)},${quote(now)});\n`;
}

function main() {
  const { values } = parseArgs({ options: {
    "account-id": {type:"string"}, "idempotency-key": {type:"string"}, "add-brands": {type:"string"},
    "analysis-packs": {type:"string"}, subscription: {type:"string"}, reason: {type:"string"},
    apply: {type:"boolean",default:false}, help: {type:"boolean",default:false},
  }});
  if (values.help) {
    console.log("node tools/provision-social.mjs --account-id UUID --idempotency-key UUID --reason TEXT [--add-brands N] [--analysis-packs N] [--subscription active|inactive] [--apply]\nDefaults to SQL preview. --apply operates ONLY on local D1. One extra Brand adds 3 identities; one pack adds 50 analyses. Reuse the key for the same logical request.");
    return;
  }
  const sql = buildProvisionSql(values);
  if (!values.apply) {console.log(sql);return;}
  const dir = mkdtempSync(join(tmpdir(),"capyra-provision-"));
  try {
    const file = join(dir,"provision.sql");writeFileSync(file,sql,{mode:0o600});
    const root = resolve(fileURLToPath(new URL("..",import.meta.url)));
    const result = spawnSync(process.execPath,[join(root,"node_modules/wrangler/bin/wrangler.js"),"d1","execute","capyra-production","--local","--file",file], {
      cwd:join(root,"apps/api"),stdio:"inherit",env:{...process.env,XDG_CONFIG_HOME:process.env.XDG_CONFIG_HOME ?? join(tmpdir(),"capyra-xdg")},
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } finally {rmSync(dir,{recursive:true,force:true});}
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {main();} catch(error) {console.error(error.message);process.exitCode=1;}
}
