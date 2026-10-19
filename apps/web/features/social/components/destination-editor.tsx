"use client";
import { useEffect, useState } from "react";
import { VIDEO_ANALYSIS_ENABLED } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MediaPreview } from "@/features/source-assets";
import type { AnalysisListItemContract } from "@/lib/models";
import type { SourceAssetItemContract } from "@/lib/models";
import { getCapabilities, saveDestination } from "../api/social-api";
import type { SocialAccount, Destination, Capabilities, DestinationInput } from "../types/social";
import { formatLabels } from "../utils/state";
import { DestinationSettings } from "./destination-settings";
export function DestinationEditor({
  accessToken,
  publicationId,
  accounts,
  assets,
  analyses,
  initial,
  analysisId,
  onSaved,
  onClose,
}: {
  accessToken: string;
  publicationId: string;
  accounts: SocialAccount[];
  assets: SourceAssetItemContract[];
  analyses: AnalysisListItemContract[];
  initial?: Destination;
  analysisId?: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [accountId, setAccountId] = useState(initial?.socialAccountId ?? "");
  const [format, setFormat] = useState(initial?.format ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [media, setMedia] = useState(initial?.mediaAssetIds ?? []);
  const [cover, setCover] = useState(initial?.coverAssetId ?? "");
  const [analysis, setAnalysis] = useState(initial?.analysisId ?? (VIDEO_ANALYSIS_ENABLED ? analysisId : undefined) ?? "");
  const [settings, setSettings] = useState<Record<string, unknown>>(initial?.settings ?? {});
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const account = accounts.find((a) => a.id === accountId);
  useEffect(() => {
    let live = true;
    setCaps(null);
    if (accountId)
      void getCapabilities(accessToken, accountId)
        .then((c) => {
          if (live) setCaps(c);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    return () => {
      live = false;
    };
  }, [accessToken, accountId]);
  function invalidateConsent() {
    if (account?.platform === "tiktok") setSettings((v) => ({ ...v, previewConfirmed: false, expressConsentGiven: false }));
  }
  function toggle(id: string) {
    invalidateConsent();
    setMedia((v) => (v.includes(id) ? v.filter((i) => i !== id) : [...v, id]));
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(initial ? "Editar Destino" : "Adicionar Destino")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const body: DestinationInput = {
                socialAccountId: accountId,
                format: format as DestinationInput["format"],
                content,
                title,
                description,
                mediaAssetIds: media,
                coverAssetId: cover || undefined,
                analysisId: VIDEO_ANALYSIS_ENABLED ? analysis || undefined : initial?.analysisId ?? undefined,
                settings,
              };
              await saveDestination(accessToken, publicationId, body, initial?.id);
              onSaved();
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              {t("Conta social")}
              <select
                aria-label={t("Conta social")}
                required
                value={accountId}
                onChange={(e) => {
                  setAccountId(e.target.value);
                  setFormat("");
                  setSettings({});
                }}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="">{t("Selecionar")}</option>
                {accounts
                  .filter((a) => a.status === "active" && a.identityStatus === "verified")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.platform} · {a.displayName}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("Formato")}
              <select
                aria-label={t("Formato")}
                required
                value={format}
                onChange={(e) => {
                  invalidateConsent();
                  setFormat(e.target.value);
                }}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              >
                <option value="">{t("Selecionar")}</option>
                {caps?.formats.map((f) => (
                  <option key={f} value={f}>
                    {t(formatLabels[f] ?? f)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            {t("Título")}
            <Input
              value={title}
              onChange={(e) => {
                invalidateConsent();
                setTitle(e.target.value);
              }}
            />
          </label>
          <label>
            {t("Conteúdo")}
            <Textarea
              value={content}
              onChange={(e) => {
                invalidateConsent();
                setContent(e.target.value);
              }}
            />
          </label>
          <label>
            {t("Descrição")}
            <Textarea
              value={description}
              onChange={(e) => {
                invalidateConsent();
                setDescription(e.target.value);
              }}
            />
          </label>
          <fieldset className="grid gap-3">
            <legend className="mb-2 font-medium">{t("Mídias na ordem de publicação")}</legend>
            {assets.length === 0 ? <p>{t("Envie mídia para esta Marca na Biblioteca.")}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((a) => (
                <label key={a.id} className="grid gap-2 rounded-xl border p-3">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={media.includes(a.id)} onChange={() => toggle(a.id)} />
                    <span className="truncate">
                      {media.includes(a.id) ? `${media.indexOf(a.id) + 1}. ` : ""}
                      {a.sourceLabel}
                    </span>
                  </span>
                  <MediaPreview asset={a} />
                  <span className="text-xs">{t(a.metadataStatus ?? "pending")}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{t("A ordem segue a seleção. Desmarque e selecione novamente para reorganizar.")}</p>
          </fieldset>
          <label>
            {t("Capa (opcional)")}
            <select
              value={cover}
              onChange={(e) => {
                invalidateConsent();
                setCover(e.target.value);
              }}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">{t("Sem capa")}</option>
              {assets
                .filter((a) => a.mediaKind === "image")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.sourceLabel}
                  </option>
                ))}
            </select>
          </label>
          {VIDEO_ANALYSIS_ENABLED ? <>
          <label>
            {t("Vínculo de análise (opcional)")}
            <select
              aria-label={t("Vínculo de análise (opcional)")}
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">{t("Sem análise vinculada")}</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.sourceLabel} · {a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted-foreground">{t("O vínculo é observacional e não comprova que a análise causou o desempenho.")}</p>
          </> : null}
          {caps && !caps.canPost ? (
            <p role="alert" className="text-destructive">
              {t("Esta Conta social não pode publicar no momento.")}
            </p>
          ) : null}
          {account ? <DestinationSettings platform={account.platform} capabilities={caps} settings={settings} onChange={setSettings} /> : null}
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer font-medium">{t("Prévia do Destino")}</summary>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="whitespace-pre-wrap">{content}</p>
            <p className="whitespace-pre-wrap text-sm">{description}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {media.map((id) => {
                const a = assets.find((a) => a.id === id);
                return a ? <MediaPreview key={id} asset={a} /> : null;
              })}
            </div>
          </details>
          {error ? (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button disabled={busy || !accountId}>{t("Salvar rascunho")}</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Fechar")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
