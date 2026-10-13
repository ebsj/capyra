#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

import { Command, CommanderError, Option } from "commander";

import type { AnalysisDetailResponseContract, AnalysisSkillId, LatestAnalysisListResponseContract } from "@capyra/contracts";
import {
  CAPYRA_CLI_CLIENT_ID,
  CapyraApiError,
  CapyraClient,
  DEFAULT_OAUTH_SCOPES,
  type OutputFormat,
  createLocalTokenStore,
  formatApiError,
  getAuthenticatedClient,
  pollAnalysis,
  toTokenStoreRecord,
} from "@capyra/integration-core";

type GlobalOptions = {
  baseUrl?: string;
  format: OutputFormat;
  sessionFile?: string;
};

type AnalysisCreateOptions = {
  brandId: string;
  url?: string;
  asset?: string;
  file?: string;
  skill: string[];
  language?: string;
};

type LoginOptions = {
  clientId: string;
  scope: string[];
  browser: boolean;
};

type WaitOptions = {
  interval: string;
  timeout: string;
};

type AnalysisLatestOptions = {
  limit: string;
  cursor?: string;
};

function collectValue(value: string, previous: string[]) {
  return [...previous, value];
}

function parsePositiveSeconds(value: string, fieldName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new CommanderError(1, "capyra.invalid_argument", `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function getGlobals(program: Command): GlobalOptions {
  const options = program.opts<GlobalOptions>();
  return {
    baseUrl: options.baseUrl,
    format: options.format ?? "json",
    sessionFile: options.sessionFile,
  };
}

function createBaseClient(options: GlobalOptions) {
  return new CapyraClient({
    baseUrl: options.baseUrl,
  });
}

function createStore(options: GlobalOptions) {
  return createLocalTokenStore(options.sessionFile);
}

function emitOutput(format: OutputFormat, value: unknown, renderHuman?: () => string) {
  if (format === "human" && renderHuman) {
    process.stdout.write(`${renderHuman()}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function emitError(format: OutputFormat, error: unknown) {
  if (format === "json") {
    const payload =
      error instanceof CapyraApiError
        ? {
            error: {
              code: error.code,
              status: error.status,
              message: error.message,
              fieldErrors: error.fieldErrors,
              details: error.details,
            },
          }
        : {
            error: {
              code: "cli_error",
              message: formatApiError(error),
            },
          };

    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  process.stderr.write(`${formatApiError(error)}\n`);
}

function normalizeScopes(scopes: string[]) {
  const values = scopes.length > 0 ? scopes : [...DEFAULT_OAUTH_SCOPES];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

async function resolveSkillSelection(client: CapyraClient, requestedSkills: string[]) {
  if (requestedSkills.length > 0) {
    return [...new Set(requestedSkills)] as AnalysisSkillId[];
  }

  const catalog = await client.getAnalysisSkills();
  return catalog.items.map((item) => item.id);
}

function renderAnalysisSummary(analysis: AnalysisDetailResponseContract) {
  return [
    `Analysis ${analysis.id}`,
    `status: ${analysis.status}`,
    `source: ${analysis.sourceLabel}`,
    `skills: ${analysis.selectedSkillIds.join(", ")}`,
    analysis.overallScore == null ? null : `overallScore: ${analysis.overallScore}`,
    analysis.summary ? `summary: ${analysis.summary}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function renderLatestAnalyses(response: LatestAnalysisListResponseContract) {
  if (response.items.length === 0) {
    return response.message || "No analyses found.";
  }

  const header = response.presentation?.answer ?? response.message;
  const table = response.presentation?.markdownTable;
  if (table) {
    return `${header}\n\n${table}`;
  }

  return [
    header,
    ...response.items.map((item) => {
      const skills = item.executedSkills.length > 0 ? item.executedSkills.join(", ") : item.selectedSkills.join(", ");
      const score = item.overallScore == null ? "-" : String(item.overallScore);
      return `${item.createdAt} ${item.fileName} ${item.status} ${skills} score=${score} ${item.mainOpportunity ?? item.oneLineSummary}`;
    }),
  ].join("\n");
}

async function maybeOpenBrowser(url: string) {
  const launchers: Array<[string, string[]]> =
    process.platform === "darwin"
      ? [["open", [url]]]
      : process.platform === "win32"
        ? [["cmd", ["/c", "start", "", url]]]
        : [["xdg-open", [url]]];

  for (const [command, args] of launchers) {
    const launched = await new Promise<boolean>((resolve) => {
      const child = spawn(command, args, {
        stdio: "ignore",
        detached: true,
      });

      child.once("error", () => resolve(false));
      child.once("spawn", () => {
        child.unref();
        resolve(true);
      });
    });

    if (launched) {
      return;
    }
  }
}

function detectRequestedFormat(argv: string[]): OutputFormat {
  const formatIndex = argv.findIndex((item) => item === "--format");
  if (formatIndex >= 0 && argv[formatIndex + 1] === "human") {
    return "human";
  }

  return process.env.CAPYRA_OUTPUT_FORMAT === "human" ? "human" : "json";
}

async function run() {
  const program = new Command();
  program
    .name("capyra")
    .description("Capyra platform CLI for analyses, assets, and OAuth-backed integrations.")
    .showHelpAfterError()
    .option("--base-url <url>", "Capyra API base URL", process.env.CAPYRA_API_BASE_URL)
    .addOption(
      new Option("--format <format>", "Output format")
        .choices(["json", "human"])
        .default(process.env.CAPYRA_OUTPUT_FORMAT === "human" ? "human" : "json"),
    )
    .option("--session-file <path>", "Override the local CLI session file", process.env.CAPYRA_CLI_SESSION_FILE);

  program
    .command("login")
    .description("Authenticate the CLI using the Capyra device flow.")
    .option("--client-id <clientId>", "OAuth client id", CAPYRA_CLI_CLIENT_ID)
    .option("--scope <scope>", "OAuth scope to request", collectValue, [])
    .option("--no-browser", "Do not attempt to open the verification URL in a browser")
    .action(async (options: LoginOptions) => {
      const globals = getGlobals(program);
      const client = createBaseClient(globals);
      const store = createStore(globals);
      const scopes = normalizeScopes(options.scope);
      const deviceCode = await client.createDeviceCode({
        clientId: options.clientId,
        scopes,
      });

      if (options.browser) {
        await maybeOpenBrowser(deviceCode.verificationUriComplete);
      }

      process.stderr.write(
        [
          "Finish login in your browser to authorize this CLI.",
          `Verification URL: ${deviceCode.verificationUri}`,
          `Verification URL (complete): ${deviceCode.verificationUriComplete}`,
          `User code: ${deviceCode.userCode}`,
        ].join("\n") + "\n",
      );

      while (true) {
        try {
          const token = await client.exchangeDeviceCode({
            clientId: options.clientId,
            deviceCode: deviceCode.deviceCode,
          });

          const record = toTokenStoreRecord(options.clientId, token);
          await store.write(record);

          emitOutput(globals.format, {
            status: "authenticated",
            clientId: options.clientId,
            verificationUri: deviceCode.verificationUri,
            userCode: deviceCode.userCode,
            scopes: record.scope.split(" "),
            expiresAt: record.expiresAt,
            user: token.user,
            account: token.account,
          }, () =>
            [
              `Authenticated as ${token.user.email}`,
              `account: ${token.account.displayName}`,
              `clientId: ${options.clientId}`,
              `scopes: ${record.scope}`,
            ].join("\n"),
          );

          return;
        } catch (error) {
          if (error instanceof CapyraApiError && error.code === "authorization_pending") {
            await new Promise((resolve) => setTimeout(resolve, deviceCode.interval * 1_000));
            continue;
          }

          throw error;
        }
      }
    });

  program
    .command("logout")
    .description("Revoke the refresh token and clear the local session.")
    .action(async () => {
      const globals = getGlobals(program);
      const store = createStore(globals);
      const session = await store.read();

      if (session) {
        try {
          await createBaseClient(globals).revokeRefreshToken({
            clientId: session.clientId,
            refreshToken: session.refreshToken,
          });
        } catch {
          // Ignore revocation failures to ensure logout remains local-first.
        }
      }

      await store.clear();
      emitOutput(globals.format, { status: session ? "logged_out" : "already_logged_out" }, () =>
        session ? "Logged out." : "No local session was present.",
      );
    });

  program
    .command("whoami")
    .description("Describe the authenticated Capyra session.")
    .action(async () => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const session = await client.getOAuthSession();
      emitOutput(globals.format, session, () =>
        [
          `${session.user.name} <${session.user.email}>`,
          `account: ${session.account.displayName}`,
          ...(session.brands ?? []).map((brand) => `brand: ${brand.id} ${brand.name} (${brand.status})`),
          `clientId: ${session.clientId ?? "first-party"}`,
          `scopes: ${session.scopes.join(", ")}`,
          `expiresAt: ${session.expiresAt}`,
        ].join("\n"),
      );
    });

  const skills = program.command("skills").description("Inspect the published Capyra skill catalog.");
  skills
    .command("list")
    .description("List published analysis skills.")
    .action(async () => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const catalog = await client.getAnalysisSkills();
      emitOutput(globals.format, catalog, () =>
        catalog.items.map((item) => `${item.id}: ${item.name}`).join("\n"),
      );
    });

  const assets = program.command("assets").description("Inspect and upload source assets.");
  assets
    .command("list")
    .description("List reusable source assets for the current account.")
    .action(async () => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const response = await client.listSourceAssets();
      emitOutput(globals.format, response, () =>
        response.items.length === 0
          ? "No source assets found."
          : response.items.map((item) => `${item.id} ${item.sourceLabel}`).join("\n"),
      );
    });

  assets
    .command("upload")
    .description("Upload a new source asset file.")
    .argument("<file>", "Path to the local media file")
    .requiredOption("--brand-id <brandId>", "Brand UUID from capyra whoami")
    .action(async (filePath: string, options: { brandId: string }) => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const asset = await client.uploadSourceAssetFromPath(filePath, options.brandId);
      emitOutput(globals.format, asset, () => `Uploaded ${asset.sourceLabel} as ${asset.id}`);
    });

  const analyses = program.command("analyses").description("Create and inspect analyses.");
  analyses
    .command("create")
    .description("Create an analysis from a public URL, an existing asset, or a local file.")
    .requiredOption("--brand-id <brandId>", "Brand UUID from capyra whoami")
    .option("--url <url>", "Public video URL")
    .option("--asset <sourceAssetId>", "Existing source asset id")
    .option("--file <path>", "Path to a local video file")
    .option("--skill <skillId>", "Selected analysis skill", collectValue, [])
    .option("--language <language>", "Requested language hint", "pt-BR")
    .action(async (options: AnalysisCreateOptions) => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const selectedInputs = [options.url, options.asset, options.file].filter(Boolean);
      if (selectedInputs.length !== 1) {
        throw new CommanderError(
          1,
          "capyra.invalid_argument",
          "Provide exactly one of --url, --asset, or --file.",
        );
      }

      const skills = await resolveSkillSelection(client, options.skill);
      let analysis: AnalysisDetailResponseContract;

      if (options.url) {
        analysis = await client.createAnalysisFromUrl(options.url, skills, options.brandId, options.language);
      } else if (options.asset) {
        analysis = await client.createAnalysisFromSourceAsset(options.asset, skills, options.brandId, options.language);
      } else {
        analysis = await client.createAnalysisFromFile(options.file!, skills, options.brandId, options.language);
      }

      emitOutput(globals.format, analysis, () => renderAnalysisSummary(analysis));
    });

  analyses
    .command("list")
    .description("List analyses for the current account.")
    .action(async () => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const response = await client.listAnalyses();
      emitOutput(globals.format, response, () =>
        response.items.length === 0
          ? "No analyses found."
          : response.items.map((item) => `${item.id} ${item.status} ${item.sourceLabel}`).join("\n"),
      );
    });

  analyses
    .command("latest")
    .description("List latest analyses with count context and table-ready fields.")
    .option("--limit <limit>", "Number of latest analyses to return, from 1 to 50", "10")
    .option("--cursor <cursor>", "Opaque continuation cursor from a previous latest response")
    .action(async (options: AnalysisLatestOptions) => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const limit = Number.parseInt(options.limit, 10);
      if (!Number.isFinite(limit)) {
        throw new CommanderError(1, "capyra.invalid_argument", "limit must be an integer.");
      }

      const response = await client.listLatestAnalyses({
        limit,
        cursor: options.cursor,
        includeSummary: true,
        includeSkillDetails: false,
        includePresentation: globals.format === "human",
      });
      emitOutput(globals.format, response, () => renderLatestAnalyses(response));
    });

  analyses
    .command("get")
    .description("Get a single analysis by id.")
    .argument("<analysisId>", "Analysis id")
    .action(async (analysisId: string) => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const analysis = await client.getAnalysis(analysisId);
      emitOutput(globals.format, analysis, () => renderAnalysisSummary(analysis));
    });

  analyses
    .command("wait")
    .description("Poll an analysis until it leaves the pending state.")
    .argument("<analysisId>", "Analysis id")
    .option("--interval <seconds>", "Polling interval in seconds", "2")
    .option("--timeout <seconds>", "Maximum wait time in seconds", "300")
    .action(async (analysisId: string, options: WaitOptions) => {
      const globals = getGlobals(program);
      const { client } = await getAuthenticatedClient(createBaseClient(globals), createStore(globals));
      const analysis = await pollAnalysis(client, analysisId, {
        intervalMs: parsePositiveSeconds(options.interval, "interval") * 1_000,
        timeoutMs: parsePositiveSeconds(options.timeout, "timeout") * 1_000,
      });

      emitOutput(globals.format, analysis, () => renderAnalysisSummary(analysis));
    });

  await program.parseAsync(process.argv);
}

run().catch((error) => {
  emitError(detectRequestedFormat(process.argv), error);
  process.exit(1);
});
