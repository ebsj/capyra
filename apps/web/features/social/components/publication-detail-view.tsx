"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Brand } from "@/features/brands";
import { listLinkableAnalyses } from "@/features/analyses/api/list-linkable-analyses";
import type { AnalysisListItemContract } from "@/lib/models";
import type { SourceAssetItemContract } from "@/lib/models";
import { listLibraryAssets } from "@/features/source-assets/api/library-api";
import { listBrands } from "@/features/brands/api/brands-api";
import { getPublication, listConnections } from "../api/social-api";
import type { Publication, SocialAccount, Destination } from "../types/social";
import { DestinationEditor } from "./destination-editor";
import { DestinationCard } from "./destination-card";
export function PublicationDetailView({ accessToken, id, analysisId }: { accessToken: string; id: string; analysisId?: string }) {
  const { t } = useI18n();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisListItemContract[]>([]);
  const [assets, setAssets] = useState<SourceAssetItemContract[]>([]);
  const [editing, setEditing] = useState<Destination | null | undefined>();
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const p = await getPublication(accessToken, id);
      setPublication(p);
      const [b, c, a, history] = await Promise.all([
        listBrands(accessToken),
        listConnections(accessToken, p.brandId),
        listLibraryAssets(accessToken, p.brandId),
        listLinkableAnalyses(accessToken, p.brandId),
      ]);
      setBrand(b.items.find((b) => b.id === p.brandId) ?? null);
      setAccounts(c.items);
      setAssets(a.items);
      setAnalyses(history.items.filter((a) => a.brandId === p.brandId && a.status === "completed"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    }
  }
  useEffect(() => {
    void refresh();
  }, [accessToken, id]);
  return (
    <div className="grid gap-5">
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {publication && brand ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{publication.title}</h2>
              <p className="text-muted-foreground">
                {brand.name} · {brand.timeZone}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refresh()}>
                {t("Atualizar")}
              </Button>
              <Button disabled={brand.status !== "active"} onClick={() => setEditing(null)}>
                {t("Adicionar Destino")}
              </Button>
            </div>
          </div>
          {brand.status !== "active" ? <p>{t("Marca arquivada: somente leitura.")}</p> : null}
          {!brand.confirmedAt ? <p className="text-destructive">{t("Confirme o nome e o fuso da Marca antes de agendar.")}</p> : null}
          {editing !== undefined ? (
            <DestinationEditor
              key={editing?.id ?? "new"}
              accessToken={accessToken}
              publicationId={id}
              accounts={accounts}
              assets={assets}
              analyses={analyses}
              initial={editing ?? undefined}
              analysisId={analysisId}
              onSaved={() => void refresh()}
              onClose={() => setEditing(undefined)}
            />
          ) : null}
          {publication.destinations.length === 0 ? (
            <p>{t("Adicione um Destino para preparar a publicação.")}</p>
          ) : (
            publication.destinations.map((d) => (
              <DestinationCard
                key={`${d.id}:${d.status}`}
                destination={d}
                accessToken={accessToken}
                timeZone={brand.timeZone}
                editable={brand.status === "active"}
                onEdit={() => setEditing(d)}
                onChanged={() => void refresh()}
              />
            ))
          )}
        </>
      ) : !error ? (
        <p>{t("Carregando...")}</p>
      ) : null}
    </div>
  );
}
