"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { BrandSelect, type Brand } from "@/features/brands";
import { listPublications, createPublication } from "../api/social-api";
import type { Publication } from "../types/social";
import { stateLabels } from "../utils/state";
export function PublicationsView({ accessToken, initialBrandId = "", analysisId }: { accessToken: string; initialBrandId?: string; analysisId?: string }) {
  const { t, href, locale } = useI18n();
  const [brandId, setBrandId] = useState(initialBrandId);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [items, setItems] = useState<Publication[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agenda, setAgenda] = useState(false);
  async function refresh(next?: string) {
    if (!brandId) return;
    setBusy(true);
    setError("");
    try {
      const r = await listPublications(accessToken, brandId, next);
      setItems((v) => (next ? [...v, ...r.items] : r.items));
      setCursor(r.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setItems([]);
    setCursor(undefined);
    void refresh();
  }, [accessToken, brandId]);
  return (
    <div className="grid gap-5">
      <BrandSelect accessToken={accessToken} value={brandId} onChange={setBrandId} onSelected={setSelectedBrand} disabled={busy} includeArchived />
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("Nova publicação")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const p = await createPublication(accessToken, brandId, title);
                window.location.assign(href(`/social-publications/${p.id}${analysisId ? `?analysisId=${encodeURIComponent(analysisId)}` : ""}`));
              } catch (e) {
                setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
                setBusy(false);
              }
            }}
          >
            <Input aria-label={t("Título da publicação")} className="max-w-lg" required value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button disabled={!brandId || busy || selectedBrand?.status !== "active"}>{t("Criar rascunho")}</Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">{t("Uma Publicação reúne Destinos independentes. A análise é opcional.")}</p>
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Button variant={agenda ? "outline" : "default"} onClick={() => setAgenda(false)}>
          {t("Publicações")}
        </Button>
        <Button variant={agenda ? "default" : "outline"} onClick={() => setAgenda(true)}>
          {t("Agenda")}
        </Button>
        <Button variant="ghost" disabled={busy || !brandId} onClick={() => void refresh()}>
          {t("Atualizar")}
        </Button>
      </div>
      {agenda ? (
        <div className="grid gap-3">
          {items
            .flatMap((p) => p.destinations.filter((d) => d.scheduledAt).map((d) => ({ p, d })))
            .sort((a, b) => Date.parse(a.d.scheduledAt!) - Date.parse(b.d.scheduledAt!))
            .map(({ p, d }) => (
              <Link className="rounded-xl border bg-card p-4" key={d.id} href={href(`/social-publications/${p.id}`)}>
                <p className="font-medium">
                  {p.title} · {d.platform}
                </p>
                <p>
                  {new Date(d.scheduledAt!).toLocaleString(locale, { timeZone: d.timeZone ?? "UTC" })} · {d.timeZone ?? "UTC"}
                </p>
                <p>{t(stateLabels[d.status] ?? d.status)}</p>
              </Link>
            ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={href(`/social-publications/${p.id}`)} className="hover:underline">
                    {p.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p>{t(stateLabels[p.status] ?? p.status)}</p>
                <p className="text-sm text-muted-foreground">
                  {p.destinations.length} {t("Destinos")} · {new Date(p.updatedAt).toLocaleString(locale)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {brandId && items.length === 0 ? <p>{t("Nenhuma publicação nesta Marca.")}</p> : null}
      {cursor ? (
        <Button variant="outline" disabled={busy} onClick={() => void refresh(cursor)}>
          {t("Carregar mais")}
        </Button>
      ) : null}
    </div>
  );
}
