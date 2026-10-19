"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { BrandSelect, type Brand } from "@/features/brands";
import type { SourceAssetItemContract } from "@/lib/models";
import { createSourceAsset } from "../api/create-source-asset";
import { listLibraryAssets, removeLibraryAsset } from "../api/library-api";
import { MediaPreview } from "./media-preview";
export function LibraryView({ accessToken, initialBrandId = "" }: { accessToken: string; initialBrandId?: string }) {
  const { t } = useI18n();
  const [brandId, setBrandId] = useState(initialBrandId);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [assets, setAssets] = useState<SourceAssetItemContract[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [variant, setVariant] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    if (brandId) setAssets((await listLibraryAssets(accessToken, brandId)).items);
  }
  useEffect(() => {
    setAssets([]);
    setVariant("");
    let live = true;
    if (brandId) {
      setBusy(true);
      void listLibraryAssets(accessToken, brandId)
        .then((r) => {
          if (live) setAssets(r.items);
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setBusy(false);
        });
    }
    return () => {
      live = false;
    };
  }, [accessToken, brandId]);
  async function run(work: () => Promise<unknown>) {
    setError("");
    setBusy(true);
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6">
      <BrandSelect accessToken={accessToken} value={brandId} onChange={setBrandId} onSelected={setSelectedBrand} disabled={busy} includeArchived />
      <p className="text-muted-foreground">
        {t("Vídeos e imagens privados, até 200 MB. Variantes são arquivos preparados por você; o Capyra não transforma a mídia.")}
      </p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("Enviar mídia")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (file && brandId)
                void run(async () => {
                  if (file.size > 200 * 1024 * 1024) throw new Error(t("O arquivo deve ter até 200 MB."));
                  await createSourceAsset(accessToken, file, brandId, variant || undefined);
                  setFile(null);
                });
            }}
          >
            <Input type="file" accept="video/*,image/*" aria-label={t("Arquivo de mídia")} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <label>
              {t("Variante de mídia (opcional)")}
              <select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={variant} onChange={(e) => setVariant(e.target.value)}>
                <option value="">{t("Mídia original")}</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.sourceLabel}
                  </option>
                ))}
              </select>
            </label>
            <Button disabled={busy || !brandId || !file || selectedBrand?.status !== "active"}>{t(busy ? "Enviando..." : "Enviar mídia")}</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="break-all text-base">{a.sourceLabel}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <MediaPreview asset={a} />
              <p className="text-sm">
                {t(a.mediaKind === "image" ? "Imagem" : "Vídeo")} · {t(a.metadataStatus ?? "pending")}
              </p>
              {a.metadata ? (
                <p className="text-sm">
                  {a.metadata.width} × {a.metadata.height}
                  {a.metadata.durationSeconds != null ? ` · ${a.metadata.durationSeconds}s` : ""}
                </p>
              ) : null}
              {a.variantOfAssetId ? <p className="text-sm">{t("Variante de mídia")}</p> : null}
              <Button
                variant="outline"
                disabled={busy || selectedBrand?.status !== "active"}
                onClick={() => {
                  if (window.confirm(t("Solicitar exclusão desta mídia? O arquivo expirará em 30 dias se não estiver em uso.")))
                    void run(() => removeLibraryAsset(accessToken, a.id));
                }}
              >
                {t("Solicitar exclusão")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {brandId && assets.length === 0 ? <p>{t("Nenhuma mídia nesta Marca.")}</p> : null}
      <Button variant="ghost" disabled={!brandId || busy} onClick={() => void run(refresh)}>
        {t("Atualizar metadados")}
      </Button>
    </div>
  );
}
