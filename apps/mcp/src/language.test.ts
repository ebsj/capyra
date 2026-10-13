import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_ANALYSIS_LANGUAGE, MCP_LANGUAGE_CODES, localizeBrowserUrl, resolveMcpLanguage } from "./language.js";

const uploadUrl = "https://web.capyra.co/integrations/source-assets/7c4492d1-9c4f-4ab4-8886-fd01fcf4c2f1";

test("MCP tool language codes stay closed to the supported app languages", () => {
  assert.deepEqual(MCP_LANGUAGE_CODES, ["en", "es", "pt-BR"]);
});

test("explicit tool language wins over ChatGPT locale metadata", () => {
  const language = resolveMcpLanguage("en", { "openai/locale": "pt-BR" });

  assert.equal(language, "en");
  assert.equal(
    localizeBrowserUrl(uploadUrl, language),
    "https://web.capyra.co/en/integrations/source-assets/7c4492d1-9c4f-4ab4-8886-fd01fcf4c2f1",
  );
});

test("ChatGPT locale metadata localizes upload urls when tool language is omitted", () => {
  const language = resolveMcpLanguage(undefined, { "openai/locale": "es-ES" });

  assert.equal(language, "es-ES");
  assert.equal(
    localizeBrowserUrl(uploadUrl, language),
    "https://web.capyra.co/es/integrations/source-assets/7c4492d1-9c4f-4ab4-8886-fd01fcf4c2f1",
  );
});

test("legacy webplus locale metadata is used before the Portuguese fallback", () => {
  const language = resolveMcpLanguage(undefined, { "webplus/i18n": "english" });

  assert.equal(language, "english");
  assert.equal(
    localizeBrowserUrl(uploadUrl, language),
    "https://web.capyra.co/en/integrations/source-assets/7c4492d1-9c4f-4ab4-8886-fd01fcf4c2f1",
  );
});

test("Portuguese remains the fallback when no language signal is available", () => {
  const language = resolveMcpLanguage(undefined, {});

  assert.equal(language, DEFAULT_ANALYSIS_LANGUAGE);
  assert.equal(
    localizeBrowserUrl(uploadUrl, language),
    "https://web.capyra.co/pt-br/integrations/source-assets/7c4492d1-9c4f-4ab4-8886-fd01fcf4c2f1",
  );
});
