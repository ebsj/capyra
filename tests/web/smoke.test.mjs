import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("web scaffold exposes health route", async () => {
  const route = await readFile(new URL("../../apps/web/app/api/health/route.ts", import.meta.url), "utf8");
  assert.match(route, /capyra-web/);
  assert.match(route, /healthy/);
});

test("tailwind scans feature modules for moved UI classes", async () => {
  const tailwindConfig = await readFile(new URL("../../apps/web/tailwind.config.ts", import.meta.url), "utf8");
  assert.match(tailwindConfig, /"\.\/features\/\*\*\/\*\.\{ts,tsx\}"/);
});

test("root redirects to login without session and dashboard with session", async () => {
  const page = await readFile(new URL("../../apps/web/app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /readActiveAuthSessionFromCookieStore/);
  assert.match(page, /localizePath\(session \? "\/dashboard" : "\/login", locale\)/);
});

test("authenticated routes preserve the shell, route map, and investigation flow", async () => {
  const layout = await readFile(new URL("../../apps/web/app/(app)/layout.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../../apps/web/app/(app)/dashboard/page.tsx", import.meta.url), "utf8");
  const analyses = await readFile(new URL("../../apps/web/app/(app)/analyses/page.tsx", import.meta.url), "utf8");
  const newAnalysisPage = await readFile(new URL("../../apps/web/app/(app)/analyses/new/page.tsx", import.meta.url), "utf8");
  const detail = await readFile(new URL("../../apps/web/app/(app)/analyses/[id]/page.tsx", import.meta.url), "utf8");
  const shell = await readFile(new URL("../../apps/web/components/app-shell.tsx", import.meta.url), "utf8");
  const dashboardView = await readFile(new URL("../../apps/web/features/analyses/components/dashboard-view.tsx", import.meta.url), "utf8");
  const newAnalysisView = await readFile(new URL("../../apps/web/features/analyses/components/new-analysis-view.tsx", import.meta.url), "utf8");
  const historyView = await readFile(new URL("../../apps/web/features/analyses/components/analyses-index-view.tsx", import.meta.url), "utf8");
  const analysisCard = await readFile(new URL("../../apps/web/features/analyses/components/analysis-card.tsx", import.meta.url), "utf8");
  const analysisComposer = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer.tsx", import.meta.url), "utf8");
  const analysisComposerHeader = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-header.tsx", import.meta.url), "utf8");
  const analysisComposerSkills = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-skills.tsx", import.meta.url), "utf8");
  const analysisComposerReview = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-review.tsx", import.meta.url), "utf8");
  const analysisComposerSourceTabs = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-source-tabs.tsx", import.meta.url), "utf8");
  const analysisComposerFlow = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-composer-flow.ts", import.meta.url), "utf8");
  const analysesApi = await readFile(new URL("../../apps/web/features/analyses/api/analyses-api.ts", import.meta.url), "utf8");
  const getFeedbackReactionsRequest = await readFile(new URL("../../apps/web/features/analyses/api/get-analysis-feedback-reactions.ts", import.meta.url), "utf8");
  const getFeedbackReactionsRequestServer = await readFile(new URL("../../apps/web/features/analyses/api/get-analysis-feedback-reactions.server.ts", import.meta.url), "utf8");
  const upsertFeedbackReactionRequest = await readFile(new URL("../../apps/web/features/analyses/api/upsert-analysis-feedback-reaction.ts", import.meta.url), "utf8");
  const clearFeedbackReactionRequest = await readFile(new URL("../../apps/web/features/analyses/api/clear-analysis-feedback-reaction.ts", import.meta.url), "utf8");
  const reviewFeedbackReactionRequest = await readFile(new URL("../../apps/web/features/analyses/api/get-analysis-feedback-reaction-review.ts", import.meta.url), "utf8");
  const listAnalysisSkillsRequest = await readFile(new URL("../../apps/web/features/analyses/api/list-analysis-skills.ts", import.meta.url), "utf8");
  const listAnalysisSkillsRequestServer = await readFile(new URL("../../apps/web/features/analyses/api/list-analysis-skills.server.ts", import.meta.url), "utf8");
  const deleteAnalysisRequest = await readFile(new URL("../../apps/web/features/analyses/api/delete-analysis.ts", import.meta.url), "utf8");
  const sourceAssetsApi = await readFile(new URL("../../apps/web/features/source-assets/api/source-assets-api.ts", import.meta.url), "utf8");
  const sourceAssetsBrowserApi = await readFile(new URL("../../apps/web/features/source-assets/api/source-assets-browser-api.ts", import.meta.url), "utf8");
  const listSourceAssetsRequest = await readFile(new URL("../../apps/web/features/source-assets/api/list-source-assets.ts", import.meta.url), "utf8");
  const listSourceAssetsRequestServer = await readFile(new URL("../../apps/web/features/source-assets/api/list-source-assets.server.ts", import.meta.url), "utf8");
  const createSourceAssetRequest = await readFile(new URL("../../apps/web/features/source-assets/api/create-source-asset.ts", import.meta.url), "utf8");
  const createSourceAssetDirectUploadRequest = await readFile(new URL("../../apps/web/features/source-assets/api/create-source-asset-direct-upload.ts", import.meta.url), "utf8");
  const completeSourceAssetDirectUploadRequest = await readFile(new URL("../../apps/web/features/source-assets/api/complete-source-asset-direct-upload.ts", import.meta.url), "utf8");
  const uploadDirectSourceAssetBlobRequest = await readFile(new URL("../../apps/web/features/source-assets/api/upload-direct-source-asset-blob.ts", import.meta.url), "utf8");
  const sourceAssetsPublicIndex = await readFile(new URL("../../apps/web/features/source-assets/index.ts", import.meta.url), "utf8");
  const detailView = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-view.tsx", import.meta.url), "utf8");
  const detailUtils = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-utils.ts", import.meta.url), "utf8");
  const detailActions = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-actions.tsx", import.meta.url), "utf8");
  const detailArtifacts = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-artifacts.tsx", import.meta.url), "utf8");
  const detailData = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-data.tsx", import.meta.url), "utf8");
  const detailFindings = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-findings.tsx", import.meta.url), "utf8");
  const detailReactionControls = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-reaction-controls.tsx", import.meta.url), "utf8");
  const detailShared = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-shared.tsx", import.meta.url), "utf8");
  const detailSkills = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-skills.tsx", import.meta.url), "utf8");
  const feedbackItems = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-feedback-items.ts", import.meta.url), "utf8");
  const artifactUtils = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-artifact-utils.ts", import.meta.url), "utf8");
  const analysisLanguage = await readFile(new URL("../../apps/web/lib/analysis-language.ts", import.meta.url), "utf8");
  const badge = await readFile(new URL("../../apps/web/components/ui/badge.tsx", import.meta.url), "utf8");
  const webMiddleware = await readFile(new URL("../../apps/web/middleware.ts", import.meta.url), "utf8");
  const siteProxy = await readFile(new URL("../../apps/site/src/proxy.ts", import.meta.url), "utf8");
  const uploadSessionView = await readFile(new URL("../../apps/web/features/source-assets/components/upload-session/upload-session-view.tsx", import.meta.url), "utf8");
  const http = await readFile(new URL("../../apps/web/lib/http.ts", import.meta.url), "utf8");

  assert.match(layout, /AppShell/);
  assert.doesNotMatch(layout, /modal: ReactNode/);
  assert.doesNotMatch(layout, /\{modal\}/);
  assert.match(dashboard, /DashboardView/);
  assert.match(dashboard, /accessToken,/);
  assert.match(dashboard, /session=\{\{/);
  assert.match(analyses, /AnalysesIndexView/);
  assert.match(detail, /AnalysisDetailView/);

  assert.match(shell, /SidebarProvider/);
  assert.match(shell, /SidebarTrigger/);
  assert.match(shell, /SidebarInset className="min-h-svh"/);
  assert.doesNotMatch(shell, /SidebarInset className="[^"]*overflow-x/);
  assert.match(shell, /<main className="min-w-0 flex-1 px-4 py-6/);
  assert.doesNotMatch(shell, /<main className="[^"]*overflow-x-(?:hidden|clip)/);
  assert.match(shell, /mx-auto flex w-full min-w-0 max-w-7xl/);
  assert.match(shell, /Nova análise/);
  assert.match(shell, /resolveShellMeta/);
  assert.doesNotMatch(shell, /deep link/);
  assert.doesNotMatch(shell, /Composer, métricas e análises recentes/);
  assert.doesNotMatch(shell, /CreateAnalysisDialog/);
  assert.doesNotMatch(shell, /Ledger autenticado para triagem, investigação e retomada do fluxo\./);
  assert.doesNotMatch(shell, /CTA visível na navegação e no conteúdo/);

  assert.match(dashboardView, /AnalysisCard/);
  assert.match(dashboardView, /status === "pending"/);
  assert.match(dashboardView, /Nota média/);
  assert.match(dashboardView, /Em andamento/);
  assert.match(dashboardView, /Análises pendentes/);
  assert.match(dashboardView, /capyra-sleeping\.png/);
  assert.match(dashboardView, /href\("\/analyses\/new"\)/);
  assert.match(newAnalysisView, /AnalysisComposer/);
  assert.match(newAnalysisView, /router\.push\(href\(`\/analyses\/\$\{analysis\.id\}`\)\)/);
  assert.doesNotMatch(dashboardView, /Home logada/);
  assert.doesNotMatch(dashboardView, /A Home agora funciona/);
  assert.doesNotMatch(dashboardView, /detalhe abre em modal/);
  assert.doesNotMatch(dashboardView, /Próximo passo recomendado/);
  assert.doesNotMatch(dashboardView, /Abrir criação contextual/);

  assert.match(historyView, /Histórico privado vazio/);
  assert.match(historyView, /Buscar no histórico/);
  assert.match(historyView, /Status/);
  assert.match(historyView, /AnalysisCard/);
  assert.match(historyView, /PAGE_SIZE = 9/);
  assert.match(historyView, /paginatedItems/);
  assert.match(historyView, /Página \{currentPage\} de \{totalPages\}/);
  assert.match(historyView, /capyra-backpack\.png/);
  assert.doesNotMatch(historyView, /modal preserva deep link/);

  assert.match(analysisCard, /Abrir detalhe/);
  assert.match(analysisCard, /href=\{href\(`\/analyses\/\$\{item\.id\}`\)\}/);
  assert.match(analysisCard, /formatRelativeDate/);
  assert.match(analysisCard, /getAnalysisSkillLabel/);
  assert.match(analysisCard, /getAnalysisSkillBadgeVariant/);

  assert.match(analysisComposer, /listAnalysisSkills\(accessToken\)/);
  assert.match(analysesApi, /export \{ listAnalysisSkillsForServer \} from "\.\/list-analysis-skills\.server"/);
  assert.match(analysesApi, /getAnalysisFeedbackReactionsForServer/);
  assert.match(analysesApi, /upsertAnalysisFeedbackReaction/);
  assert.match(analysesApi, /clearAnalysisFeedbackReaction/);
  assert.match(analysesApi, /getAnalysisFeedbackReactionReviewForServer/);
  assert.match(listAnalysisSkillsRequest, /createBrowserApiRequest\(accessToken\)/);
  assert.match(listAnalysisSkillsRequestServer, /createServerApiRequest\(accessToken\)/);
  assert.match(listAnalysisSkillsRequest, /"\/analysis-skills"/);
  assert.match(getFeedbackReactionsRequest, /createBrowserApiRequest\(accessToken\)/);
  assert.match(getFeedbackReactionsRequestServer, /createServerApiRequest\(accessToken\)/);
  assert.match(getFeedbackReactionsRequest, /\/feedback-reactions\/mine/);
  assert.match(upsertFeedbackReactionRequest, /method: "PUT"/);
  assert.match(upsertFeedbackReactionRequest, /feedbackItemKey/);
  assert.match(clearFeedbackReactionRequest, /method: "DELETE"/);
  assert.match(reviewFeedbackReactionRequest, /\/feedback-reactions\/review\?limit=/);
  assert.match(analysisComposer, /response\.items\.filter\(\(item\) => item\.status === "published"\)/);
  assert.match(newAnalysisPage, /initialCatalog=\{catalog\.items\.filter\(\(item\) => item\.status === "published"\)\}/);
  assert.match(analysisComposer, /setSelectedSkills\(\(current\) => current\.filter\(\(skillId\) => published\.some\(\(item\) => item\.id === skillId\)\)\)/);
  assert.match(analysisComposerSkills, /catalog\.map\(\(item\) =>/);
  assert.doesNotMatch(analysisComposerSkills, /compliance/);
  assert.match(analysisComposerReview, /catalog\.find\(\(item\) => item\.id === skillId\)/);
  assert.doesNotMatch(analysisComposerReview, /getAnalysisSkillLabel\(skillId/);
  assert.match(detailUtils, /compliance: "Compliance"/);
  assert.match(analysisComposer, /onDrop=\{handleDrop\}/);
  assert.match(analysisComposer, /createSourceAsset\(accessToken, file as File, brandId\)/);
  assert.match(sourceAssetsBrowserApi, /export \{ createSourceAsset \} from "\.\/create-source-asset"/);
  assert.match(sourceAssetsBrowserApi, /export \{ listSourceAssets \} from "\.\/list-source-assets"/);
  assert.match(sourceAssetsApi, /export \{ listSourceAssetsForServer \} from "\.\/list-source-assets\.server"/);
  assert.match(listSourceAssetsRequest, /createBrowserApiRequest\(accessToken\)/);
  assert.match(listSourceAssetsRequestServer, /createServerApiRequest\(accessToken\)/);
  assert.match(listSourceAssetsRequest, /"\/source-assets"/);
  assert.match(sourceAssetsPublicIndex, /UploadSessionView/);
  assert.doesNotMatch(sourceAssetsPublicIndex, /createSourceAsset/);
  assert.doesNotMatch(sourceAssetsPublicIndex, /listSourceAssets/);
  assert.match(analysisComposer, /@\/features\/source-assets\/api\/source-assets-browser-api/);
  assert.doesNotMatch(analysisComposer, /@\/features\/source-assets\/api\/source-assets-api/);
  assert.match(analysisComposerSourceTabs, /value="url"/);
  assert.match(analysisComposerSourceTabs, /Arquivo/);
  assert.match(analysisComposerSourceTabs, /Salvos/);
  assert.match(analysisComposerSourceTabs, /grid min-w-0 gap-4/);
  assert.match(analysisComposerSourceTabs, /TabsList className="grid h-auto w-full min-w-0/);
  assert.match(analysisComposerSourceTabs, /className="shrink-0 rounded-2xl"/);
  assert.match(analysisComposerHeader, /capyra-camera\.png/);
  assert.match(analysisComposerFlow, /selectedSkillsCount === 0/);
  assert.match(analysisComposerFlow, /selecionar pelo menos uma skill publicada/);
  assert.match(analysisComposer, /hasReadySource\(mode, url, file, selectedSourceAssetId\)/);
  assert.doesNotMatch(analysisComposer, /createAnalysisWithSelectedSkillsFromFile/);
  assert.match(analysisComposer, /createAnalysisFromSourceAsset/);
  assert.match(analysisComposer, /createAnalysisFromUrl/);
  assert.match(analysisComposer, /getAnalysisLanguage\(locale\)/);
  assert.match(analysisComposer, /language: analysisLanguage/);
  assert.doesNotMatch(analysisComposer, /language: "pt-BR"/);

  assert.match(analysisLanguage, /export function getAnalysisLanguage/);
  assert.match(analysisLanguage, /locale === "en" \|\| locale === "es"/);

  assert.match(detailUtils, /buildExecutedSkillSections/);
  assert.match(detailUtils, /buildEvidenceHighlights/);
  assert.match(detailUtils, /buildInterpretationNotes/);
  assert.match(detailUtils, /buildWarningNotes/);
  assert.match(detailUtils, /getAnalysisSkillBadgeVariant/);
  assert.match(detailUtils, /completed: "success"/);
  assert.match(detailUtils, /insufficient_evidence: "warning"/);
  assert.match(detailUtils, /pending: "sand"/);
  assert.match(detailUtils, /failed: "danger"/);
  assert.match(detailUtils, /displayTimeZone = "America\/Sao_Paulo"/);
  assert.match(detailUtils, /timeZone: displayTimeZone/);

  assert.match(artifactUtils, /buildArtifactPreviewMetadata/);
  assert.match(artifactUtils, /isFrameArtifact/);
  assert.match(artifactUtils, /Ampliar frame/);

  assert.match(detailView, /Tabs defaultValue="skills"/);
  assert.match(detail, /Promise\.all/);
  assert.match(detail, /getAnalysisFeedbackReactionsForServer/);
  assert.doesNotMatch(detail, /getAnalysisFeedbackReactionReviewForServer/);
  assert.doesNotMatch(detail, /session\.user\.role === "owner"/);
  assert.match(detailView, /TabsList\s*\n\s*variant="line"/);
  assert.match(detailShared, /LOW_SCORE_THRESHOLD = 6/);
  assert.match(detailShared, /ReactionStateByKey/);
  assert.match(detailView, /xl:grid-cols-5/);
  assert.match(detailView, /TabsTrigger\s*\n\s*value="skills"/);
  assert.doesNotMatch(detailView, /value="summary"/);
  assert.match(detailView, /TabsContent value="skills"/);
  assert.match(detailView, /TabsContent value="artifacts"/);
  assert.match(detailView, /TabsContent value="data"/);
  assert.doesNotMatch(detailView, /surface = "page"/);
  assert.doesNotMatch(detailView, /detalhe em modal/);
  assert.match(detailView, /DeleteAnalysisDialog/);
  assert.match(detailView, /PendingAnalysisRefresher/);
  assert.match(detailActions, /Excluir análise/);
  assert.match(detailActions, /Confirmar exclusão/);
  assert.match(detailActions, /router\.replace\(href\("\/analyses"\)\)/);
  assert.match(detailActions, /router\.refresh\(\)/);
  assert.match(detailActions, /window\.setInterval/);
  assert.match(detailActions, /status !== "pending"/);
  assert.match(detailActions, /deleteAnalysis\(analysis\.id\)/);
  assert.match(detailActions, /error\.status === 404/);
  assert.match(detailView, /getFailedAnalysisRecoveryState/);
  assert.match(detailView, /buildRecommendationFindings/);
  assert.match(detailView, /myFeedbackReactions/);
  assert.match(detailView, /reviewer=\{reviewer\}/);
  assert.doesNotMatch(detailView, /feedbackReview/);
  assert.doesNotMatch(detailView, /AnalysisFeedbackReviewPanel/);
  assert.match(detailView, /SkillsPanel/);
  assert.doesNotMatch(detailView, /ActionPanel/);
  assert.match(feedbackItems, /recommendation:\$\{skillId\}:\$\{itemIndex\}/);
  assert.match(detailFindings, /buildRecommendationFeedbackItemKey/);
  assert.match(detailFindings, /AnalysisDetailReactionControls/);
  assert.match(detailFindings, /reviewer=\{reviewer\}/);
  assert.match(detailFindings, /feedbackItemKey/);
  assert.match(detailReactionControls, /ThumbsUp/);
  assert.match(detailReactionControls, /ThumbsDown/);
  assert.match(detailReactionControls, /label: positiveLabel/);
  assert.match(detailReactionControls, /label: negativeLabel/);
  assert.match(detailReactionControls, /aria-label=\{label\}/);
  assert.match(detailReactionControls, /handleReactionSelect/);
  assert.match(detailReactionControls, /nextReaction === selectedReaction/);
  assert.match(detailReactionControls, /await handleClearFeedback\(\)/);
  assert.match(detailReactionControls, /formatDateTime\(reaction\.updatedAt, locale\)/);
  assert.match(detailReactionControls, /t\("Avaliação"\)/);
  assert.match(detailReactionControls, /reviewer\.name/);
  assert.match(detailReactionControls, /reviewer\.email/);
  assert.match(detailReactionControls, /Avaliada em \{date\}/);
  assert.match(detailReactionControls, /Salvar comentário/);
  assert.match(detailReactionControls, /Editar/);
  assert.match(detailReactionControls, /Apagar/);
  assert.match(detailReactionControls, /size="icon"/);
  assert.doesNotMatch(detailReactionControls, /<ThumbsUp[^>]*\/>\s*\{positiveLabel\}/);
  assert.doesNotMatch(detailReactionControls, /<ThumbsDown[^>]*\/>\s*\{negativeLabel\}/);
  assert.doesNotMatch(detailReactionControls, /router\.refresh\(\)/);
  assert.doesNotMatch(detailReactionControls, /import \{[^}]*Save/);
  assert.doesNotMatch(detailReactionControls, /saveLabel/);
  assert.match(detailReactionControls, /Textarea/);
  assert.match(detailReactionControls, /upsertAnalysisFeedbackReaction/);
  assert.match(detailReactionControls, /clearAnalysisFeedbackReaction/);
  assert.doesNotMatch(detailReactionControls, /Remover avaliação/);
  assert.match(detailReactionControls, /Escreva um comentário ou escolha útil\/não útil/);
  assert.match(detailReactionControls, /persistReaction\(null, savedComment\)/);
  assert.match(detailReactionControls, /disabled=\{disabled \|\| trimmedComment\.length === 0 \|\| !commentChanged\}/);
  assert.match(detailReactionControls, /maxLength=\{1000\}/);
  assert.match(detailData, /DetailGroup/);
  assert.match(detailArtifacts, /ArtifactPreview/);
  assert.match(detailArtifacts, /ArtifactTile/);
  assert.match(detailArtifacts, /DialogTrigger asChild/);
  assert.match(detailActions, /DialogFooter/);
  assert.match(detailActions, /Alert variant="destructive"/);
  assert.match(detailView, /capyra-workout\.png/);
  assert.match(detailFindings, /Pontos de atenção/);
  assert.match(detailView, /Artefatos/);
  assert.match(detailView, /DataPanel/);
  assert.match(detailData, /Nota geral/);
  assert.match(detailData, /Transcrição/);
  assert.match(detailSkills, /Avaliação detalhada/);
  assert.match(detailSkills, /Notas por propriedade/);
  assert.match(detailFindings, /Oportunidade de melhoria/);
  assert.match(detailSkills, /Recomendações/);
  assert.match(detailSkills, /Trechos da transcrição/);
  assert.match(detailSkills, /Evidências/);
  assert.match(detailData, /Avisos e limites/);
  assert.match(detailView, /overallScore/);
  assert.match(detailSkills, /skillScore/);
  assert.match(detailArtifacts, /preload="none"/);

  assert.match(badge, /success:/);
  assert.match(badge, /warning:/);
  assert.match(badge, /danger:/);
  assert.match(badge, /brandSoft:/);
  assert.match(badge, /navy:/);
  assert.match(webMiddleware, /brand\\\/\[a-z0-9-\]\+\\\.png/);
  assert.match(webMiddleware, /iconAliasPath/);
  assert.match(webMiddleware, /favicon\\\.ico/);
  assert.match(webMiddleware, /`style-src \$\{styleSrc\.join\(" "\)\}`/);
  assert.match(webMiddleware, /const styleSrcElem = allowLocalReviewTools \? \[`'self'`, `'unsafe-inline'`\] : \[`'self'`, `'nonce-\$\{nonce\}'`\]/);
  assert.match(webMiddleware, /sourceAssetUploadOrigin = "https:\/\/\*\.r2\.cloudflarestorage\.com"/);
  assert.match(webMiddleware, /readLocalSourceAssetUploadOrigin\(process\.env\.CAPYRA_SOURCE_ASSET_UPLOAD_ORIGIN\)/);
  assert.match(webMiddleware, /sourceAssetUploadOrigin,\s+localSourceAssetUploadOrigin/);
  assert.match(siteProxy, /iconAliasPath/);
  assert.match(siteProxy, /apple-touch-icon/);
  assert.match(uploadSessionView, /createSourceAsset\(accessToken, file, session.brandId\)/);
  assert.match(createSourceAssetRequest, /createSourceAssetDirectUpload\(accessToken, directUploadRequest\)/);
  assert.match(createSourceAssetRequest, /uploadDirectSourceAssetBlob\(directUpload, file\)/);
  assert.match(createSourceAssetRequest, /completeSourceAssetDirectUpload\(accessToken, directUpload\.sourceAssetId, directUploadRequest\)/);
  assert.match(uploadSessionView, /completeSourceAssetUploadSession\(accessToken, session\.id, \{ sourceAssetId: created\.id \}\)/);

  assert.match(deleteAnalysisRequest, /request<void>\(`\/analyses\/\$\{analysisId\}`/);
  assert.match(deleteAnalysisRequest, /method: "DELETE"/);
  assert.match(createSourceAssetDirectUploadRequest, /"\/source-assets\/direct-uploads"/);
  assert.match(completeSourceAssetDirectUploadRequest, /`\/source-assets\/direct-uploads\/\$\{sourceAssetId\}\/complete`/);
  assert.match(uploadDirectSourceAssetBlobRequest, /fetchImpl\(upload\.uploadUrl/);
  assert.doesNotMatch(http, /"\/analyses"/);
  assert.doesNotMatch(http, /"\/source-assets"/);
});

test("analysis creation keeps locale in request language and detail navigation", async () => {
  const newAnalysisView = await readFile(new URL("../../apps/web/features/analyses/components/new-analysis-view.tsx", import.meta.url), "utf8");
  const analysisComposer = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer.tsx", import.meta.url), "utf8");

  assert.match(newAnalysisView, /const \{ href \} = useI18n\(\)/);
  assert.match(newAnalysisView, /router\.push\(href\(`\/analyses\/\$\{analysis\.id\}`\)\)/);
  assert.match(analysisComposer, /const analysisLanguage = getAnalysisLanguage\(locale\)/);
});

test("shared ui primitives stay domain-free while consumers own localized labels", async () => {
  const shell = await readFile(new URL("../../apps/web/components/app-shell.tsx", import.meta.url), "utf8");
  const dialog = await readFile(new URL("../../apps/web/components/ui/dialog.tsx", import.meta.url), "utf8");
  const drawer = await readFile(new URL("../../apps/web/components/ui/drawer.tsx", import.meta.url), "utf8");
  const sheet = await readFile(new URL("../../apps/web/components/ui/sheet.tsx", import.meta.url), "utf8");
  const sidebar = await readFile(new URL("../../apps/web/components/ui/sidebar.tsx", import.meta.url), "utf8");
  const detailActions = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-actions.tsx", import.meta.url), "utf8");
  const detailArtifacts = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-artifacts.tsx", import.meta.url), "utf8");

  for (const primitive of [dialog, drawer, sheet, sidebar]) {
    assert.doesNotMatch(primitive, /useI18n/);
    assert.doesNotMatch(primitive, /components\/i18n\/i18n-provider/);
  }

  assert.match(dialog, /closeLabel = "Close"/);
  assert.match(drawer, /closeLabel = "Close"/);
  assert.match(sheet, /closeLabel = "Close"/);
  assert.match(sidebar, /label = "Toggle sidebar"/);
  assert.match(sidebar, /relative flex min-w-0 flex-1 border-l flex-col bg-background/);
  assert.match(sidebar, /group-data-\[collapsible=icon\]:w-\[calc\(var\(--sidebar-width-icon\)\+theme\(spacing\.6\)\)\]/);
  assert.doesNotMatch(sidebar, /relative flex w-full flex-1 flex-col bg-background/);
  assert.match(shell, /group-data-\[collapsible=icon\]:p-3/);
  assert.match(shell, /label=\{t\("Alternar sidebar"\)\}/);
  assert.match(detailActions, /closeLabel=\{t\("Fechar"\)\}/);
  assert.match(detailArtifacts, /closeLabel=\{t\("Fechar"\)\}/);
});

test("auth flow uses Firebase email links and preserves the same session contract", async () => {
  const authLayout = await readFile(new URL("../../apps/web/app/(auth)/layout.tsx", import.meta.url), "utf8");
  const authIntroPanel = await readFile(new URL("../../apps/web/features/auth/components/shared/auth-intro-panel.tsx", import.meta.url), "utf8");
  const rootLayout = await readFile(new URL("../../apps/web/app/layout.tsx", import.meta.url), "utf8");
  const loginPage = await readFile(new URL("../../apps/web/app/(auth)/login/page.tsx", import.meta.url), "utf8");
  const loginConfirmPage = await readFile(new URL("../../apps/web/app/(auth)/login/confirm/page.tsx", import.meta.url), "utf8");
  const registerPage = await readFile(new URL("../../apps/web/app/(auth)/register/page.tsx", import.meta.url), "utf8");
  const firebaseConfigScript = await readFile(
    new URL("../../apps/web/components/firebase-public-config-script.tsx", import.meta.url),
    "utf8",
  );
  const loginForm = await readFile(new URL("../../apps/web/features/auth/components/login/email-link-login-form.tsx", import.meta.url), "utf8");
  const loginConfirmForm = await readFile(new URL("../../apps/web/features/auth/components/login/email-link-confirm-form.tsx", import.meta.url), "utf8");
  const authResumeMessages = await readFile(new URL("../../apps/web/features/auth/utils/auth-resume-message.ts", import.meta.url), "utf8");
  const firebaseLib = await readFile(new URL("../../apps/web/lib/firebase.ts", import.meta.url), "utf8");
  const authApi = await readFile(new URL("../../apps/web/features/auth/api/auth-api.ts", import.meta.url), "utf8");
  const signInWithFirebaseRequest = await readFile(new URL("../../apps/web/features/auth/api/sign-in-with-firebase.ts", import.meta.url), "utf8");
  const signInWithFirebaseEmailLinkRequest = await readFile(new URL("../../apps/web/features/auth/api/sign-in-with-firebase-email-link.ts", import.meta.url), "utf8");
  const shell = await readFile(new URL("../../apps/web/components/app-shell.tsx", import.meta.url), "utf8");
  assert.match(authLayout, /AuthIntroPanel/);
  assert.match(authIntroPanel, /Acesso flexível/);
  assert.match(authIntroPanel, /Escolha o Google ou receba um link de acesso/);
  assert.match(rootLayout, /FirebasePublicConfigScript/);
  assert.match(firebaseConfigScript, /FIREBASE_PUBLIC_CONFIG_SCRIPT_ID/);
  assert.match(firebaseConfigScript, /readFirebasePublicConfig\(process\.env\)/);

  assert.match(loginPage, /EmailLinkLoginForm/);
  assert.match(loginPage, /initialEmail=\{params\.email\}/);
  assert.match(loginPage, /reason=\{params\.reason\}/);

  assert.match(loginConfirmPage, /EmailLinkConfirmForm/);
  assert.match(loginConfirmPage, /Confirmar acesso/);

  assert.match(registerPage, /redirect\(`/);
  assert.match(registerPage, /localizePath\("\/login", locale\)/);
  assert.match(registerPage, /normalizeNextHref\(params\.next\)/);
  assert.doesNotMatch(registerPage, /AuthForm/);

  assert.match(loginForm, /sendFirebaseEmailLink/);
  assert.match(loginForm, /readPendingFirebaseEmail/);
  assert.match(loginForm, /signInWithFirebaseGoogle/);
  assert.match(loginForm, /signInWithFirebase/);
  assert.match(loginForm, /FirebaseSignInRequestContract/);
  assert.match(loginForm, /Entrar com Google/);
  assert.match(loginForm, /Use sua conta Google ou digite seu e-mail/);
  assert.match(loginForm, /setClientAuthSession/);
  assert.match(loginForm, /router\.replace\(invitationTokenFromNext\(safeNextHref\) \? href\("\/brands"\) : safeNextHref\)/);
  assert.doesNotMatch(loginForm, /account_not_found/);
  assert.doesNotMatch(loginForm, /firebase-account-missing/);
  assert.doesNotMatch(loginForm, /href\("\/register"\)/);
  assert.doesNotMatch(loginForm, /handleCodeInApp/);
  assert.doesNotMatch(loginForm, /localStorage para retomar/);
  assert.doesNotMatch(loginForm, /sem senha/);
  assert.doesNotMatch(loginForm, /type="password"/);

  assert.match(loginConfirmForm, /isFirebaseEmailLink/);
  assert.match(loginConfirmForm, /signInWithFirebaseEmailLink/);
  assert.match(loginConfirmForm, /clearPendingFirebaseEmail/);
  assert.match(loginConfirmForm, /setClientAuthSession/);
  assert.match(loginConfirmForm, /router\.replace\(invitationTokenFromNext\(safeNextHref\) \? href\("\/brands"\) : safeNextHref\)/);
  assert.doesNotMatch(loginConfirmForm, /account_not_found/);
  assert.doesNotMatch(loginConfirmForm, /firebase-account-missing/);
  assert.doesNotMatch(loginConfirmForm, /href\("\/register"\)/);
  assert.doesNotMatch(authResumeMessages, /firebase-account-missing/);

  assert.match(firebaseLib, /sendSignInLinkToEmail/);
  assert.match(firebaseLib, /isSignInWithEmailLink/);
  assert.match(firebaseLib, /signInWithEmailLink/);
  assert.match(firebaseLib, /GoogleAuthProvider/);
  assert.match(firebaseLib, /signInWithPopup/);
  assert.match(firebaseLib, /prompt: "select_account"/);
  assert.match(firebaseLib, /handleCodeInApp: true/);
  assert.match(firebaseLib, /clearPendingFirebaseEmail/);
  assert.match(firebaseLib, /buildFirebaseEmailLinkUrl/);
  assert.match(firebaseLib, /window\.__CAPYRA_FIREBASE_PUBLIC_CONFIG__/);
  assert.match(firebaseLib, /document\.getElementById\(FIREBASE_PUBLIC_CONFIG_SCRIPT_ID\)/);
  assert.match(firebaseLib, /JSON\.parse\(rawConfig\)/);

  assert.match(authApi, /export \{ signInWithFirebase \} from "\.\/sign-in-with-firebase"/);
  assert.match(authApi, /export \{ signInWithFirebaseEmailLink \} from "\.\/sign-in-with-firebase-email-link"/);
  assert.doesNotMatch(authApi, /registerAccount/);
  assert.match(signInWithFirebaseRequest, /"\/auth\/firebase"/);
  assert.match(signInWithFirebaseEmailLinkRequest, /"\/auth\/email-link"/);

  assert.match(shell, /signOutFirebaseAuth/);
  assert.match(shell, /router\.replace\(href\("\/login"\)\)/);
});

test("web runtime packaging preserves Firebase public config on Cloudflare", async () => {
  const wrangler = await readFile(new URL("../../apps/web/wrangler.jsonc", import.meta.url), "utf8");
  const viteConfig = await readFile(new URL("../../apps/web/vite.config.ts", import.meta.url), "utf8");
  const firebaseConfigLib = await readFile(
    new URL("../../apps/web/lib/firebase-public-config.ts", import.meta.url),
    "utf8",
  );
  const nextConfig = await readFile(new URL("../../apps/web/next.config.ts", import.meta.url), "utf8");
  assert.match(wrangler, /"binding": "API", "service": "capyra-api"/);
  assert.match(wrangler, /"pattern": "web\.capyra\.co"/);
  assert.match(viteConfig, /vinext\(\)/);
  assert.match(viteConfig, /cloudflare\(/);

  assert.match(firebaseConfigLib, /FIREBASE_PUBLIC_CONFIG_SCRIPT_ID/);
  assert.match(firebaseConfigLib, /serializeFirebasePublicConfig/);
  assert.match(firebaseConfigLib, /CAPYRA_FIREBASE_API_KEY/);
  assert.match(firebaseConfigLib, /CAPYRA_FIREBASE_PROJECT_ID/);
  assert.match(firebaseConfigLib, /CAPYRA_FIREBASE_APP_ID/);

  assert.doesNotMatch(nextConfig, /env:\s*\{/);
  assert.match(nextConfig, /Cross-Origin-Opener-Policy", value: "same-origin-allow-popups"/);
  assert.doesNotMatch(nextConfig, /Cross-Origin-Embedder-Policy", value: "require-corp"/);
});

test("web authentication has no local registration or Turnstile dependency", async () => {
  const proxy = await readFile(new URL("../../apps/web/app/api/v1/proxy.ts", import.meta.url), "utf8");
  const wrangler = await readFile(new URL("../../apps/web/wrangler.jsonc", import.meta.url), "utf8");
  assert.doesNotMatch(proxy, /CAPYRA_TURNSTILE/);
  assert.doesNotMatch(proxy, /turnstile\/v0\/siteverify/);
  assert.doesNotMatch(wrangler, /CAPYRA_TURNSTILE/);
});

test("mcp oauth discovery can advertise a public API endpoint separately from its internal API base", async () => {
  const server = await readFile(new URL("../../apps/mcp/src/server.ts", import.meta.url), "utf8");
  const wrangler = await readFile(new URL("../../apps/mcp/wrangler.jsonc", import.meta.url), "utf8");

  assert.match(server, /const API_BASE_URL = /);
  assert.match(server, /const OAUTH_API_PUBLIC_BASE_URL = \(process\.env\.CAPYRA_OAUTH_API_PUBLIC_BASE_URL\?\.trim\(\) \|\| API_BASE_URL\)/);
  assert.match(server, /new URL\("oauth\/token", ensureTrailingSlash\(OAUTH_API_PUBLIC_BASE_URL\)\)/);
  assert.match(server, /new URL\("oauth\/device\/code", ensureTrailingSlash\(OAUTH_API_PUBLIC_BASE_URL\)\)/);
  assert.match(server, /new URL\("oauth\/revoke", ensureTrailingSlash\(OAUTH_API_PUBLIC_BASE_URL\)\)/);
  assert.match(wrangler, /"binding": "API", "service": "capyra-api"/);
  assert.match(wrangler, /"CAPYRA_OAUTH_API_PUBLIC_BASE_URL": "https:\/\/api\.capyra\.co\/api\/v1"/);
});

test("session recovery and systemic states stay explicit", async () => {
  const sessionServer = await readFile(new URL("../../apps/web/lib/session.server.ts", import.meta.url), "utf8");
  const sessionClient = await readFile(new URL("../../apps/web/lib/session.ts", import.meta.url), "utf8");
  const http = await readFile(new URL("../../apps/web/lib/http.ts", import.meta.url), "utf8");
  const appLayout = await readFile(new URL("../../apps/web/app/(app)/layout.tsx", import.meta.url), "utf8");
  const dashboard = await readFile(new URL("../../apps/web/app/(app)/dashboard/page.tsx", import.meta.url), "utf8");
  const analyses = await readFile(new URL("../../apps/web/app/(app)/analyses/page.tsx", import.meta.url), "utf8");
  const detail = await readFile(new URL("../../apps/web/app/(app)/analyses/[id]/page.tsx", import.meta.url), "utf8");
  const uploadSessionPage = await readFile(new URL("../../apps/web/app/integrations/source-assets/[id]/page.tsx", import.meta.url), "utf8");
  const authLoading = await readFile(new URL("../../apps/web/app/(auth)/loading.tsx", import.meta.url), "utf8");
  const authError = await readFile(new URL("../../apps/web/app/(auth)/error.tsx", import.meta.url), "utf8");
  const appLoading = await readFile(new URL("../../apps/web/app/(app)/loading.tsx", import.meta.url), "utf8");
  const appError = await readFile(new URL("../../apps/web/app/(app)/error.tsx", import.meta.url), "utf8");
  const notFound = await readFile(new URL("../../apps/web/app/not-found.tsx", import.meta.url), "utf8");
  const systemState = await readFile(new URL("../../apps/web/components/system-state.tsx", import.meta.url), "utf8");

  assert.match(sessionServer, /readActiveAuthSessionFromCookieStore/);
  assert.match(sessionServer, /buildLoginRedirect/);
  assert.match(sessionServer, /session-expired/);
  assert.match(sessionServer, /redirectToLoginOnAuthApiError/);
  assert.match(sessionServer, /error\.status === 401 \|\| \(error\.status === 403 && error\.code === "account_access_revoked"\)/);
  assert.match(sessionClient, /redirectClientToSessionExpiredLogin/);
  assert.match(sessionClient, /clearClientAuthSession\(\)/);
  assert.match(http, /redirectOnAuthFailure/);
  assert.match(http, /redirectClientToSessionExpiredLogin/);
  assert.match(http, /error\.status === 401 \|\| \(error\.status === 403 && error\.code === "account_access_revoked"\)/);
  assert.match(appLayout, /buildLoginRedirect/);
  assert.match(appLayout, /getAuthRedirectReason/);
  assert.match(dashboard, /redirectToLoginOnAuthApiError\(error, "\/dashboard", locale\)/);
  assert.match(analyses, /redirectToLoginOnAuthApiError\(error, "\/analyses", locale\)/);
  assert.match(detail, /redirectToLoginOnAuthApiError\(error, `\/analyses\/\$\{id\}`, locale\)/);
  assert.match(uploadSessionPage, /redirectToLoginOnAuthApiError\(error, `\/integrations\/source-assets\/\$\{id\}`, locale\)/);

  assert.match(authLoading, /SystemStateSkeleton/);
  assert.match(authError, /SystemState/);
  assert.match(appLoading, /SystemStateSkeleton/);
  assert.match(appError, /SystemState/);
  assert.match(appError, /session-expired/);
  assert.match(notFound, /SystemState/);
  assert.match(systemState, /tone: SystemStateTone/);
  assert.match(systemState, /SystemStateSkeleton/);
  assert.match(systemState, /no-results/);
  assert.match(systemState, /not-found/);
});

test("Cloudflare keeps the Python processor isolated in a bounded container", async () => {
  const wrangler = await readFile(new URL("../../apps/api/wrangler.jsonc", import.meta.url), "utf8");
  const aiDockerfile = await readFile(new URL("../../apps/ai/Dockerfile.cloudflare", import.meta.url), "utf8");

  assert.match(wrangler, /"max_instances": 2/);
  assert.match(wrangler, /"instance_type": "basic"/);
  assert.match(wrangler, /"max_concurrency": 2/);
  assert.match(wrangler, /"dead_letter_queue": "capyra-analyses-dlq"/);
  assert.match(aiDockerfile, /addgroup -S -g 1654 capyra/);
  assert.match(aiDockerfile, /adduser -S -D -u 1654/);
  assert.match(aiDockerfile, /USER capyra/);
});

test("create-analysis flow stays contextual, responsive, and gated by skill selection", async () => {
  const composer = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer.tsx", import.meta.url), "utf8");
  const composerHeader = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-header.tsx", import.meta.url), "utf8");
  const composerIntent = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-intent.tsx", import.meta.url), "utf8");
  const composerStepContent = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-step-content.tsx", import.meta.url), "utf8");
  const composerReview = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-review.tsx", import.meta.url), "utf8");
  const composerSourceTabs = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-source-tabs.tsx", import.meta.url), "utf8");
  const composerSkills = await readFile(new URL("../../apps/web/features/analyses/components/composer/analysis-composer-skills.tsx", import.meta.url), "utf8");
  const composerFlow = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-composer-flow.ts", import.meta.url), "utf8");
  const intentExamples = await readFile(new URL("../../apps/web/features/analyses/utils/analysis-intent-examples.ts", import.meta.url), "utf8");
  const createAnalysisFromUrl = await readFile(new URL("../../apps/web/features/analyses/api/create-analysis-from-url.ts", import.meta.url), "utf8");
  const createAnalysisFromSourceAsset = await readFile(new URL("../../apps/web/features/analyses/api/create-analysis-from-source-asset.ts", import.meta.url), "utf8");
  const createAnalysisFromFile = await readFile(new URL("../../apps/web/features/analyses/api/create-analysis-from-file.ts", import.meta.url), "utf8");
  const analysesApi = await readFile(new URL("../../apps/web/features/analyses/api/analyses-api.ts", import.meta.url), "utf8");
  const listAnalysisSkillsRequest = await readFile(new URL("../../apps/web/features/analyses/api/list-analysis-skills.ts", import.meta.url), "utf8");
  const listAnalysisSkillsRequestServer = await readFile(new URL("../../apps/web/features/analyses/api/list-analysis-skills.server.ts", import.meta.url), "utf8");
  const sourceAssetsApi = await readFile(new URL("../../apps/web/features/source-assets/api/source-assets-api.ts", import.meta.url), "utf8");
  const sourceAssetsBrowserApi = await readFile(new URL("../../apps/web/features/source-assets/api/source-assets-browser-api.ts", import.meta.url), "utf8");
  const listSourceAssetsRequest = await readFile(new URL("../../apps/web/features/source-assets/api/list-source-assets.ts", import.meta.url), "utf8");
  const listSourceAssetsRequestServer = await readFile(new URL("../../apps/web/features/source-assets/api/list-source-assets.server.ts", import.meta.url), "utf8");
  const newAnalysisView = await readFile(new URL("../../apps/web/features/analyses/components/new-analysis-view.tsx", import.meta.url), "utf8");
  const dashboardView = await readFile(new URL("../../apps/web/features/analyses/components/dashboard-view.tsx", import.meta.url), "utf8");
  const detailView = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-view.tsx", import.meta.url), "utf8");
  const detailData = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-data.tsx", import.meta.url), "utf8");
  const detailSkills = await readFile(new URL("../../apps/web/features/analyses/components/detail/analysis-detail-skills.tsx", import.meta.url), "utf8");

  assert.match(composer, /listAnalysisSkills\(accessToken\)/);
  assert.match(composer, /listSourceAssets\(accessToken\)/);
  assert.match(analysesApi, /export \{ listAnalysisSkillsForServer \} from "\.\/list-analysis-skills\.server"/);
  assert.match(listAnalysisSkillsRequest, /createBrowserApiRequest\(accessToken\)/);
  assert.match(sourceAssetsBrowserApi, /export \{ listSourceAssets \} from "\.\/list-source-assets"/);
  assert.match(sourceAssetsApi, /export \{ listSourceAssetsForServer \} from "\.\/list-source-assets\.server"/);
  assert.match(listSourceAssetsRequestServer, /createServerApiRequest\(accessToken\)/);
  assert.match(composer, /@\/features\/source-assets\/api\/source-assets-browser-api/);
  assert.doesNotMatch(composer, /@\/features\/source-assets\/api\/source-assets-api/);
  assert.match(composer, /response\.items\.filter\(\(item\) => item\.status === "published"\)/);
  assert.match(composer, /onDrop=\{handleDrop\}/);
  assert.match(composerSourceTabs, /onDragOver/);
  assert.match(composerSourceTabs, /value="url"/);
  assert.match(composerSourceTabs, /Arquivo/);
  assert.match(composerSourceTabs, /Salvos/);
  assert.match(composerSourceTabs, /Arraste o vídeo ou selecione um arquivo/);
  assert.match(composerSourceTabs, /Arquivos salvos/);
  assert.match(composerSkills, /Skills da análise/);
  assert.match(composerFlow, /selectedSkillsCount === 0/);
  assert.match(composerFlow, /selecionar pelo menos uma skill publicada/);
  assert.match(composer, /hasReadySource\(mode, url, file, selectedSourceAssetId\)/);
  assert.match(composer, /const \[intent, setIntent\] = useState\(""\)/);
  assert.match(composer, /normalizeIntent\(intent\)/);
  assert.match(composer, /intent: normalizedIntent/);
  assert.match(composer, /getFieldErrorMessage\(err, "intent"\)/);
  assert.match(composer, /setIntent\(""\)/);
  assert.match(composer, /createSourceAsset\(accessToken, file as File, brandId\)/);
  assert.doesNotMatch(composer, /createAnalysisWithSelectedSkillsFromFile/);
  assert.match(composer, /createAnalysisFromSourceAsset/);
  assert.match(composer, /createAnalysisFromUrl/);
  assert.match(createAnalysisFromUrl, /CreateAnalysisFromUrlRequestContract/);
  assert.match(createAnalysisFromSourceAsset, /CreateAnalysisFromSourceAssetRequestContract/);
  assert.match(createAnalysisFromFile, /formData\.append\("intent", intent\)/);
  assert.match(composerStepContent, /AnalysisComposerIntent/);
  assert.match(composerStepContent, /intent=\{intent\}/);
  assert.match(composerStepContent, /setIntent=\{setIntent\}/);
  assert.match(composerIntent, /MAX_INTENT_LENGTH = 1000/);
  assert.match(composerIntent, /Textarea/);
  assert.match(composerIntent, /value=\{intent\}/);
  assert.match(composerIntent, /maxLength=\{MAX_INTENT_LENGTH \+ 1\}/);
  assert.match(composerIntent, /Objetivo do vídeo/);
  assert.match(composerIntent, /até 1000 caracteres/);
  assert.match(composerIntent, /analysisIntentExamples/);
  assert.match(composerIntent, /setIntent\(example\.text\)/);
  assert.match(composerIntent, /setIntent\(""\)/);
  assert.match(composerIntent, /Remover objetivo/);
  assert.match(intentExamples, /conversion/);
  assert.match(intentExamples, /retention/);
  assert.match(intentExamples, /clarity/);
  assert.match(intentExamples, /trust/);
  assert.match(intentExamples, /improvement/);
  assert.match(composerReview, /intent/);
  assert.match(composerReview, /Objetivo informado/);
  assert.match(composerFlow, /MAX_FILE_SIZE_BYTES/);
  assert.match(composerFlow, /ALLOWED_EXTENSIONS/);
  assert.match(composerHeader, /capyra-camera\.png/);

  assert.match(newAnalysisView, /AnalysisComposer/);
  assert.match(dashboardView, /session: AuthSessionResponseContract/);
  assert.match(dashboardView, /href\("\/analyses\/new"\)/);

  assert.match(detailView, /label=\{t\("Nota"\)\}/);
  assert.match(detailData, /Transcrição/);
  assert.match(detailData, /Skills executadas/);
  assert.match(detailData, /Objetivo informado/);
  assert.match(detailData, /analysis\.intent/);
  assert.match(detailSkills, /Notas por propriedade/);
  assert.match(detailView, /Recomendações/);
  assert.match(detailSkills, /Trechos da transcrição/);
  assert.match(detailView, /overallScore/);
  assert.match(detailSkills, /skillScore/);
});

test("api proxy preserves binary streaming and range headers for artifacts", async () => {
  const proxy = await readFile(new URL("../../apps/web/app/api/v1/proxy.ts", import.meta.url), "utf8");

  assert.match(proxy, /readActiveAuthSessionFromCookieStore/);
  assert.match(proxy, /forwardedRequestHeaders = \["accept", "content-type", "range", "if-range", "idempotency-key"\]/);
  assert.match(proxy, /forwardedResponseHeaders = \[/);
  assert.match(proxy, /"content-range"/);
  assert.match(proxy, /"accept-ranges"/);
  assert.match(proxy, /const accessToken = session\?\.accessToken \?\? null/);
  assert.match(proxy, /const body = hasBody \? request\.body : undefined/);
  assert.match(proxy, /duplex: "half"/);
  assert.match(proxy, /new NextResponse\(request\.method === "HEAD" \? null : upstream\.body/);
  assert.doesNotMatch(proxy, /upstream\.text\(\)/);
  assert.doesNotMatch(proxy, /JSON\.parse\(decodeURIComponent/);
});
