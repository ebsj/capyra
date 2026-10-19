#!/usr/bin/env node

import { pathToFileURL } from "node:url";

export function selectRollbackVersion(deployments) {
  if (!Array.isArray(deployments)) {
    throw new Error("Wrangler deployments output must be a JSON array.");
  }
  if (deployments.length === 0) {
    throw new Error("No existing deployment is available as a rollback target.");
  }

  const ordered = deployments.map((deployment, index) => {
    const createdOn = Date.parse(deployment?.created_on ?? "");
    if (!Number.isFinite(createdOn)) {
      throw new Error(`Deployment at index ${index} is missing a valid created_on timestamp.`);
    }
    return { deployment, createdOn };
  }).sort((left, right) => left.createdOn - right.createdOn);

  const latest = ordered.at(-1).deployment;
  if (!Array.isArray(latest.versions) || latest.versions.length !== 1) {
    throw new Error("The latest deployment must have exactly one version before an automatic rollback is safe.");
  }

  const [{ version_id: versionId, percentage }] = latest.versions;
  if (typeof versionId !== "string" || versionId.length === 0 || percentage !== 100) {
    throw new Error("The latest deployment must route 100% of traffic to one valid version before an automatic rollback is safe.");
  }

  return versionId;
}

export function selectRollbackVersionFromJson(value) {
  let deployments;
  try {
    deployments = JSON.parse(value);
  } catch (error) {
    throw new Error("Wrangler deployments output is not valid JSON.", { cause: error });
  }
  return selectRollbackVersion(deployments);
}

async function main() {
  let value = "";
  for await (const chunk of process.stdin) value += chunk;
  process.stdout.write(selectRollbackVersionFromJson(value));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
