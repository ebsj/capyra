"use client";
import { socialPlatforms, platformLabels } from "../utils/state";
import { useEffect, useState } from "react";
import { VIDEO_ANALYSIS_ENABLED } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { BrandSelect } from "@/features/brands";
import { listConnections, listExternalPosts, listMetrics, importExternalPost } from "../api/social-api";
import type { ExternalPost, Metric, SocialAccount } from "../types/social";
import { metricIsStale } from "../utils/state";
export function AnalyticsView({ accessToken, initialBrandId = "" }: { accessToken: string; initialBrandId?: string }) {
  const { t, locale } = useI18n();
  const [brandId, setBrandId] = useState(initialBrandId);
  const [posts, setPosts] = useState<ExternalPost[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [postCursor, setPostCursor] = useState<string>();
  const [metricCursor, setMetricCursor] = useState<string>();
  const [socialId, setSocialId] = useState("");
  const [url, setUrl] = useState("");
  const [filter, setFilter] = useState("");
  const [metricFilter, setMetricFilter] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    if (!brandId) return;
    setBusy(true);
    try {
      const [p, m, c] = await Promise.all([listExternalPosts(accessToken, brandId), listMetrics(accessToken, brandId), listConnections(accessToken, brandId)]);
      setPosts(p.items);
      setMetrics(m.items);
      setAccounts(c.items);
      setPostCursor(p.nextCursor);
      setMetricCursor(m.nextCursor);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setPosts([]);
    setMetrics([]);
    setAccounts([]);
    setSocialId("");
    setPostCursor(undefined);
    setMetricCursor(undefined);
    void refresh();
  }, [accessToken, brandId]);
  const date = (v?: string | null) => (v ? new Date(v).toLocaleString(locale) : "—");
  const visible = metrics.filter((m) => (!filter || m.platform === filter) && (!metricFilter || m.metric === metricFilter));
  return (
    <div className="grid gap-6">
      <BrandSelect accessToken={accessToken} value={brandId} onChange={setBrandId} disabled={busy} includeArchived />
      <p className="text-muted-foreground">
        {VIDEO_ANALYSIS_ENABLED ? t("Métricas nativas por rede. Dados indisponíveis não são zero; comparações são observacionais, sem atribuição causal à análise.") : t("Métricas nativas por rede. Dados indisponíveis não são zero; comparações são observacionais.")}
      </p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      <Button variant="outline" disabled={busy || !brandId} onClick={() => void refresh()}>
        {t("Atualizar")}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{t("Snapshots de métricas")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-3">
            <label>
              {t("Rede")}
              <select aria-label={t("Rede")} className="ml-2 h-10 rounded border bg-background px-3" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">{t("Todas")}</option>
                {socialPlatforms.map((v) => (
                  <option key={v} value={v}>{platformLabels[v]}</option>
                ))}
              </select>
            </label>
            <label>
              {t("Métrica")}
              <select
                aria-label={t("Métrica")}
                className="ml-2 h-10 rounded border bg-background px-3"
                value={metricFilter}
                onChange={(e) => setMetricFilter(e.target.value)}
              >
                <option value="">{t("Todas")}</option>
                {[...new Set(metrics.map((m) => m.metric))].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  {["Rede / métrica", "Valor", "Origem / período", "Observado em", "Dados até"].map((h) => (
                    <th className="p-3" key={h}>
                      {t(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.id} className="border-b align-top">
                    <td className="p-3">
                      {m.platform}
                      <br />
                      {m.metric}
                      <br />
                      <span className="text-xs text-muted-foreground">{m.destinationId ?? m.externalPostId ?? m.socialAccountId}</span>
                    </td>
                    <td className="p-3">
                      {m.value === null ? t("Indisponível") : m.value.toLocaleString(locale)}
                      <br />
                      {t(m.availability)}
                    </td>
                    <td className="p-3">
                      {m.source}
                      <br />
                      {date(m.periodStart)} — {date(m.periodEnd)}
                    </td>
                    <td className="p-3">
                      {date(m.observedAt)}
                      {metricIsStale(m.observedAt) ? <p className="text-destructive">{t("Desatualizado")}</p> : null}
                    </td>
                    <td className="p-3">{date(m.dataThrough)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length === 0 ? <p>{t("Nenhum snapshot disponível para este filtro.")}</p> : null}
          {metricCursor ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await listMetrics(accessToken, brandId, metricCursor);
                  setMetrics((v) => [...v, ...r.items]);
                  setMetricCursor(r.nextCursor);
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Carregar mais métricas")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("Importar Post externo por URL")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await importExternalPost(accessToken, socialId, url);
                setMessage(t("Importação solicitada. Atualize para acompanhar o resultado."));
                setUrl("");
              } catch (e) {
                setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
              } finally {
                setBusy(false);
              }
            }}
          >
            <select
              aria-label={t("Conta social")}
              className="h-10 rounded border bg-background px-3"
              required
              value={socialId}
              onChange={(e) => setSocialId(e.target.value)}
            >
              <option value="">{t("Selecionar")}</option>
              {accounts
                .filter((a) => a.status === "active")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.platform} · {a.displayName}
                  </option>
                ))}
            </select>
            <Input required type="url" aria-label={t("URL do Post externo")} value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button disabled={busy || !socialId}>{t("Importar")}</Button>
          </form>
        </CardContent>
      </Card>
      <h2 className="font-display text-xl">{t("Posts externos · somente leitura")}</h2>
      <p>{t("A conexão importa automaticamente os 90 dias disponíveis de metadados e métricas, sem baixar mídia.")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="capitalize text-lg">{p.platform}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="whitespace-pre-wrap">{p.content}</p>
              <p className="text-sm text-muted-foreground">{date(p.publishedAt)}</p>
              {p.url && /^https?:\/\//.test(p.url) ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {t("Ver na rede social")}
                </a>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
      {postCursor ? (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await listExternalPosts(accessToken, brandId, postCursor);
              setPosts((v) => [...v, ...r.items]);
              setPostCursor(r.nextCursor);
            } catch (e) {
              setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("Carregar mais posts")}
        </Button>
      ) : null}
    </div>
  );
}
