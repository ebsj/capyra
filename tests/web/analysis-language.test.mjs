import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("analysis creation derives transcription language from the active locale", async () => {
  const helper = await readFile(new URL("../../apps/web/lib/analysis-language.ts", import.meta.url), "utf8");
  const composer = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer.tsx", import.meta.url), "utf8");

  assert.match(helper, /export function getAnalysisLanguage/);
  assert.match(helper, /locale === "en" \|\| locale === "es"/);
  assert.match(helper, /return locale/);

  assert.match(composer, /const analysisLanguage = getAnalysisLanguage\(locale\)/);
  assert.match(composer, /language: analysisLanguage/);
  assert.doesNotMatch(composer, /language: "pt-BR"/);
});

test("analysis detail navigation preserves the active locale", async () => {
  const view = await readFile(new URL("../../apps/web/features/analyses/components/new-analysis-view.tsx", import.meta.url), "utf8");

  assert.match(view, /const \{ href \} = useI18n\(\)/);
  assert.match(view, /router\.push\(href\(`\/analyses\/\$\{analysis\.id\}`\)\)/);
  assert.doesNotMatch(view, /router\.push\(`\/analyses\/\$\{analysis\.id\}`\)/);
});

test("shell navigation resolves dashboard and new-analysis links from the active locale", async () => {
  const shell = await readFile(new URL("../../apps/web/components/app-shell.tsx", import.meta.url), "utf8");

  assert.match(shell, /const \{ href \} = useI18n\(\)/);
  assert.match(shell, /href\("\/dashboard"\)/);
  assert.match(shell, /href\("\/analyses\/new"\)/);
  assert.doesNotMatch(shell, /dashboardHref: string/);
  assert.doesNotMatch(shell, /newAnalysisHref: string/);
});

test("auth intro panel translations follow the active client locale", async () => {
  const layout = await readFile(new URL("../../apps/web/app/(auth)/layout.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../../apps/web/features/auth/components/shared/auth-intro-panel.tsx", import.meta.url), "utf8");

  assert.match(layout, /import \{ AuthIntroPanel \} from "@\/features\/auth"/);
  assert.match(layout, /<AuthIntroPanel \/>/);
  assert.doesNotMatch(layout, /getServerTranslator/);
  assert.match(panel, /"use client"/);
  assert.match(panel, /const \{ t \} = useI18n\(\)/);
  assert.match(panel, /t\("Acesso flexível"\)/);
  assert.match(panel, /t\("Entre com Google ou link no e-mail e volte direto para a análise\."\)/);
});

test("pending analysis status has an english translation", async () => {
  const messages = await readFile(new URL("../../apps/web/messages/en.json", import.meta.url), "utf8");
  const analysisUtils = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-utils.ts", import.meta.url), "utf8");

  assert.match(analysisUtils, /pending: "Em processamento"/);
  assert.match(messages, /"Em processamento": "Processing"/);
});

test("spanish locale is wired through web translations and html metadata", async () => {
  const config = await readFile(new URL("../../apps/web/lib/i18n/config.ts", import.meta.url), "utf8");
  const messages = await readFile(new URL("../../apps/web/messages/es.json", import.meta.url), "utf8");
  const layout = await readFile(new URL("../../apps/web/app/layout.tsx", import.meta.url), "utf8");

  assert.match(config, /"pt-br", "en", "es"/);
  assert.match(messages, /"Em processamento": "Procesando"/);
  assert.match(messages, /"Nova análise": "Nuevo análisis"/);
  assert.match(layout, /es: "es"/);
});

test("analysis skill display labels are resolved through a shared translated helper", async () => {
  const helper = await readFile(new URL("../../apps/web/lib/analysis-skill-display.ts", import.meta.url), "utf8");
  const options = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-options.tsx", import.meta.url), "utf8");
  const review = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-review.tsx", import.meta.url), "utf8");

  assert.match(helper, /export function getSkillDisplayName\(item: AnalysisSkillCatalogItem, t: Translate\)/);
  assert.match(helper, /export function getSkillDisplaySummary\(item: AnalysisSkillCatalogItem, t: Translate\)/);
  assert.match(options, /const displayName = getSkillDisplayName\(item, t\)/);
  assert.match(options, /const displaySummary = getSkillDisplaySummary\(item, t\)/);
  assert.match(review, /getSkillDisplayName\(item, t\)/);
});

test("mcp upload session browser url follows the requested language", async () => {
  const server = await readFile(new URL("../../apps/mcp/src/server.ts", import.meta.url), "utf8");
  const language = await readFile(new URL("../../apps/mcp/src/language.ts", import.meta.url), "utf8");

  assert.match(language, /export const WEB_LOCALES = \["pt-br", "en", "es"\] as const/);
  assert.match(language, /export const MCP_LANGUAGE_CODES = \["en", "es", "pt-BR"\] as const/);
  assert.match(language, /readMetaString\(meta, "openai\/locale"\)/);
  assert.match(language, /readMetaString\(meta, "webplus\/i18n"\)/);
  assert.match(server, /const analysisLanguageSchema = z\.enum\(MCP_LANGUAGE_CODES\)\.describe\(ANALYSIS_LANGUAGE_DESCRIPTION\)/);
  for (const toolName of [
    "start_source_asset_upload_session",
    "create_analysis_from_url",
    "create_analysis_from_source_asset",
    "summarize_analyses",
  ]) {
    const toolDefinition = server.match(
      new RegExp(`server\\.registerTool\\(\\s*"${toolName}"[\\s\\S]*?async \\(`),
    )?.[0];
    assert.ok(toolDefinition, `missing MCP tool definition: ${toolName}`);
    assert.match(toolDefinition, /language: analysisLanguageSchema/);
  }
  assert.doesNotMatch(server, /language: z\.string\(\)\.describe\(ANALYSIS_LANGUAGE_DESCRIPTION\)\.optional\(\)/);
  assert.doesNotMatch(server, /language: z\.string\(\)\.describe\(ANALYSIS_LANGUAGE_DESCRIPTION\)\.default\("pt-BR"\)/);
  assert.match(server, /const requestedLanguage = resolveMcpLanguage\(language, extra\._meta\)/);
  assert.match(server, /browserUrl: localizeBrowserUrl\(session\.browserUrl, requestedLanguage\)/);
});

test("source asset upload session status badge is translated", async () => {
  const view = await readFile(new URL("../../apps/web/features/source-assets/components/upload-session/upload-session-view.tsx", import.meta.url), "utf8");
  const utils = await readFile(new URL("../../apps/web/features/source-assets/utils/upload-session-utils.ts", import.meta.url), "utf8");
  const englishMessages = await readFile(new URL("../../apps/web/messages/en.json", import.meta.url), "utf8");
  const spanishMessages = await readFile(new URL("../../apps/web/messages/es.json", import.meta.url), "utf8");

  assert.match(utils, /pending: "Pendente"/);
  assert.match(utils, /completed: "Concluída"/);
  assert.match(utils, /expired: "Expirada"/);
  assert.match(view, /t\(SOURCE_ASSET_UPLOAD_SESSION_STATUS_LABELS\[session\.status\]\)/);
  assert.doesNotMatch(view, />\{session\.status\}<\/Badge>/);
  assert.match(englishMessages, /"Pendente": "Pending"/);
  assert.match(englishMessages, /"Expirada": "Expired"/);
  assert.match(spanishMessages, /"Pendente": "Pendiente"/);
  assert.match(spanishMessages, /"Expirada": "Expirada"/);
});
