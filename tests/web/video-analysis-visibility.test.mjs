import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = new URL("../../apps/web/", import.meta.url);
const require = createRequire(import.meta.url);

// Execute the real routes/editor with isolated auth, transport and React boundaries.
// No server, browser, OpenAI request or persisted data is needed for these cases.
async function load(entry, { enabled = false, locale = "pt-br", authenticated = true } = {}) {
  const state = { calls: [], saved: null };
  const data = `const result = name => { __state.calls.push(name); return { items: [] }; };
    export class ApiError extends Error {}
    export const listAnalyses = async () => result('analyses');
    export const listBrandsForServer = async () => result('brands');
    export const listAnalysisSkillsForServer = async () => result('skills');
    export const listSourceAssetsForServer = async () => result('assets');
    export const getAnalysis = async () => result('analysis');
    export const getAnalysisFeedbackReactionsForServer = async () => result('feedback');`;
  const stubs = {
    "next/navigation": `export function redirect(location) { throw Object.assign(new Error('redirect'), { location }); }
      export function notFound() { throw new Error('not found'); }`,
    "react": `export const useState = value => [typeof value === 'function' ? value() : value, () => {}];
      export const useEffect = () => {};`,
    "react/jsx-runtime": `export const Fragment = 'fragment';
      export const jsx = (type, props) => ({type, props}); export const jsxs = jsx;`,
    "@/lib/features": readFileSync(new URL("lib/features.ts", root), "utf8")
      .replace("VIDEO_ANALYSIS_ENABLED: boolean = false", `VIDEO_ANALYSIS_ENABLED: boolean = ${enabled}`),
    "@/lib/i18n/server": `export const getRequestLocale = async () => ${JSON.stringify(locale)};`,
    "@/lib/session.server": `export const readAuthSessionFromCookieStore = async () => null;
      export const readActiveAuthSessionFromCookieStore = async () => ${authenticated ? "({accessToken:'test',user:{},account:{}})" : "null"};
      export const getAuthRedirectReason = () => 'auth-required';
      export const buildLoginRedirect = (path, reason, locale) => '/' + locale + '/login?next=' + encodeURIComponent(path);
      export function redirectToLoginOnAuthApiError(error) { throw error; }`,
    "@/features/analyses": `export const DashboardView = 'dashboard'; export const AnalysesIndexView = 'history';
      export const NewAnalysisView = 'composer'; export const AnalysisDetailView = 'detail';`,
    "@/features/analyses/api/analyses-api": data,
    "@/features/brands/api/brands-api.server": data,
    "@/features/source-assets/api/source-assets-api": data,
    "@/components/i18n/i18n-provider": `export const useI18n = () => ({t: s => s});`,
    "@/features/source-assets": `export const MediaPreview = 'preview';`,
    "./destination-settings": `export const DestinationSettings = 'settings';`,
    "../api/social-api": `export const getCapabilities = async () => ({});
      export const saveDestination = async (...args) => { __state.saved = args; };`,
  };
  const output = await build({
    entryPoints: [fileURLToPath(new URL(entry, root))],
    bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic",
    plugins: [{ name: "web-boundaries", setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path }) => {
        if (path in stubs || path.startsWith("@/components/ui/")) return { path, namespace: "stub" };
        if (path.startsWith("@/")) return { path: fileURLToPath(new URL(`${path.slice(2)}.ts`, root)) };
      });
      builder.onLoad({ filter: /.*/, namespace: "stub" }, ({ path }) => ({
        contents: stubs[path] ?? "export const Button='button', Input='input', Textarea='textarea', Card='card', CardHeader='header', CardTitle='title', CardContent='content';",
        loader: "ts",
      }));
    } }],
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", "__state", output.outputFiles[0].text)(require, module, module.exports, state);
  return { ...module.exports, state };
}

const routes = [
  ["app/(app)/dashboard/page.tsx", "dashboard"],
  ["app/(app)/analyses/page.tsx", "history"],
  ["app/(app)/analyses/new/page.tsx", "composer"],
  ["app/(app)/analyses/[id]/page.tsx", "detail"],
];

test("hidden analysis routes redirect in every locale before loading any analysis data", async () => {
  for (const locale of ["pt-br", "en", "es"]) {
    for (const [path] of routes) {
      const page = await load(path, { locale });
      await assert.rejects(page.default({ params: Promise.resolve({ id: "old-analysis" }) }),
        error => error.location === `/${locale}/social-publications`);
      assert.deepEqual(page.state.calls, [], path);
    }
  }
});

test("hidden routes still require authentication", async () => {
  for (const [path] of routes) {
    const page = await load(path, { authenticated: false, locale: "es" });
    await assert.rejects(page.default({ params: Promise.resolve({ id: "old-analysis" }) }),
      error => error.location?.startsWith("/es/login?next="));
    assert.deepEqual(page.state.calls, []);
  }
});

test("reenabling the flag restores each original analysis route and data loading", async () => {
  for (const [path, view] of routes) {
    const page = await load(path, { enabled: true });
    const rendered = await page.default({ params: Promise.resolve({ id: "old-analysis" }) });
    assert.equal(rendered.type, view);
    assert.ok(page.state.calls.length > 0, path);
  }
});

function find(tree, type) {
  if (!tree || typeof tree !== "object") return null;
  if (tree.type === type) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) {
    const found = find(child, type);
    if (found) return found;
  }
  return null;
}

test("editing preserves an existing analysis link while hidden and ignores injected links on new destinations", async () => {
  for (const existing of ["saved-analysis", undefined]) {
    const editor = await load("features/social/components/destination-editor.tsx");
    const initial = existing ? { id: "dest", analysisId: existing } : undefined;
    const tree = editor.DestinationEditor({ accessToken: "test", publicationId: "pub", accounts: [], assets: [], analyses: [],
      initial, analysisId: "injected-query-link", onSaved() {}, onClose() {} });
    assert.doesNotMatch(JSON.stringify(tree), /Vínculo de análise|Sem análise vinculada/);
    await find(tree, "form").props.onSubmit({ preventDefault() {} });
    assert.equal(editor.state.saved[2].analysisId, existing);
    assert.equal(editor.state.saved[3], initial?.id);
  }
});

test("reenabling the flag restores analysis selection for new destinations", async () => {
  const editor = await load("features/social/components/destination-editor.tsx", { enabled: true });
  const tree = editor.DestinationEditor({ accessToken: "test", publicationId: "pub", accounts: [], assets: [], analyses: [],
    analysisId: "selected-analysis", onSaved() {}, onClose() {} });
  assert.match(JSON.stringify(tree), /Vínculo de análise/);
  await find(tree, "form").props.onSubmit({ preventDefault() {} });
  assert.equal(editor.state.saved[2].analysisId, "selected-analysis");
});

test("LinkedIn text drafts hide media and cover controls and preserve an empty media list", async () => {
  const editor = await load("features/social/components/destination-editor.tsx");
  const initial = { id: "dest", socialAccountId: "linkedin", format: "text", content: "Hello LinkedIn", mediaAssetIds: [], settings: {} };
  const tree = editor.DestinationEditor({ accessToken: "test", publicationId: "pub", accounts: [{ id: "linkedin", platform: "linkedin", status: "active", identityStatus: "verified", displayName: "Company" }], assets: [], analyses: [], initial, onSaved() {}, onClose() {} });
  const rendered = JSON.stringify(tree);
  assert.doesNotMatch(rendered, /Mídias na ordem de publicação|Capa \(opcional\)/);
  assert.match(rendered, /LinkedIn/);
  await find(tree, "form").props.onSubmit({ preventDefault() {} });
  assert.equal(editor.state.saved[2].format, "text");
  assert.deepEqual(editor.state.saved[2].mediaAssetIds, []);
});

test("LinkedIn settings omit unsupported privacy, feed and cover controls", async () => {
  const settings = await load("features/social/components/destination-settings.tsx");
  const tree = settings.DestinationSettings({ platform: "linkedin", settings: {}, capabilities: { privacyLevels: [] }, onChange() {} });
  const rendered = JSON.stringify(tree);
  assert.doesNotMatch(rendered, /Privacidade|Compartilhar no feed|Instante da capa/);
  assert.match(rendered, /3.000 caracteres/);
  const youtube = settings.DestinationSettings({ platform: "youtube", settings: {}, capabilities: { privacyLevels: ["private"] }, onChange() {} });
  assert.match(JSON.stringify(youtube), /Privacidade/);
});
