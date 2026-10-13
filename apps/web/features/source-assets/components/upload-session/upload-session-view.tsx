"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics-client";
import type { SourceAssetItem, SourceAssetUploadSessionResponseContract } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import { toDateLocale } from "@/lib/i18n/locale-format";
import {
  completeSourceAssetUploadSession,
  createSourceAsset,
  listSourceAssets,
} from "../../api/source-assets-browser-api";
import {
  ALLOWED_SOURCE_ASSET_EXTENSIONS,
  formatSourceAssetFileSize,
  getSourceAssetFileExtension,
  MAX_SOURCE_ASSET_FILE_SIZE_BYTES,
  SOURCE_ASSET_UPLOAD_SESSION_STATUS_LABELS,
} from "../../utils/upload-session-utils";

type Props = {
  accessToken: string;
  initialSession: SourceAssetUploadSessionResponseContract;
};

export function UploadSessionView({ accessToken, initialSession }: Props) {
  const { locale, t } = useI18n();
  const [session, setSession] = useState(initialSession);
  const [assets, setAssets] = useState<SourceAssetItem[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(initialSession.sourceAssetId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingAssets(true);

    void listSourceAssets(accessToken)
      .then((response) => {
        if (!cancelled) {
          setAssets(response.items.filter(asset => asset.brandId === session.brandId));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("Falha ao carregar assets."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingAssets(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const completeWithAsset = (sourceAssetId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const next = await completeSourceAssetUploadSession(accessToken, session.id, { sourceAssetId });
        setSession(next);
        setSelectedAssetId(next.sourceAssetId);
        trackGoogleAnalyticsEvent("upload_session_completed", {
          source_type: "asset",
          status: next.status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Falha ao concluir a sessão."));
      }
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = getSourceAssetFileExtension(file.name);
    if (!ALLOWED_SOURCE_ASSET_EXTENSIONS.includes(extension)) {
      setError(t("Selecione um arquivo MP4, MOV ou WEBM."));
      return;
    }

    if (file.size > MAX_SOURCE_ASSET_FILE_SIZE_BYTES) {
      setError(t("O arquivo deve ter no máximo 200 MB."));
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const created = await createSourceAsset(accessToken, file, session.brandId);
        const next = await completeSourceAssetUploadSession(accessToken, session.id, { sourceAssetId: created.id });
        setAssets((current) => [created, ...current]);
        setSession(next);
        setSelectedAssetId(created.id);
        trackGoogleAnalyticsEvent("upload_session_completed", {
          source_type: "file",
          status: next.status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Falha ao enviar o arquivo."));
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl px-6 py-16">
      <div className="grid w-full gap-6">
        <Card className="overflow-hidden rounded-[2rem] border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="grid gap-5 md:grid-cols-[1fr_136px] md:items-center">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="font-display text-3xl">{t("Selecionar asset para integração")}</CardTitle>
                  <Badge variant={session.status === "completed" ? "success" : "info"}>{t(SOURCE_ASSET_UPLOAD_SESSION_STATUS_LABELS[session.status])}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("Use um asset já enviado ou faça um novo upload para concluir esta sessão externa da Capyra.")}
                </p>
              </div>
              <div aria-hidden="true" className="relative mx-auto size-28 rounded-[1.5rem] bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--chart-4)/0.34))]">
                <Image
                  alt=""
                  className="object-contain p-2 drop-shadow-[0_14px_24px_rgb(15_23_42/0.16)]"
                  fill
                  sizes="112px"
                  src="/brand/capyra-traveler.png"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted-foreground">
              {t("Sessão {id}. Expira em {expiresAt}.", {
                id: session.id,
                expiresAt: new Date(session.expiresAt).toLocaleString(toDateLocale(locale)),
              })}
            </div>

            {session.status === "completed" ? (
              <Alert>
                <AlertTitle>{t("Sessão concluída")}</AlertTitle>
                <AlertDescription>
                  {t("O `sourceAssetId` já foi vinculado. Você pode voltar ao cliente externo e continuar o fluxo.")}
                </AlertDescription>
              </Alert>
            ) : null}

            {session.status === "expired" ? (
              <Alert variant="destructive">
                <AlertTitle>{t("Sessão expirada")}</AlertTitle>
                <AlertDescription>{t("Crie uma nova sessão no cliente externo para continuar.")}</AlertDescription>
              </Alert>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{t("Falha no fluxo")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {session.status === "pending" ? (
              <label className="grid gap-2 rounded-2xl border border-dashed border-border bg-background/70 p-5">
                <span className="text-sm font-medium text-foreground">{t("Enviar novo arquivo")}</span>
                <span className="text-sm leading-6 text-muted-foreground">{t("Aceita MP4, MOV e WEBM com até 200 MB.")}</span>
                <input type="file" accept=".mp4,.mov,.webm" onChange={handleFileChange} disabled={isPending} />
              </label>
            ) : null}

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">{t("Assets disponíveis")}</h2>
                {isLoadingAssets ? <span className="text-sm text-muted-foreground">{t("Carregando...")}</span> : null}
              </div>

              {!isLoadingAssets && assets.length === 0 ? (
                <div className="grid gap-4 rounded-2xl border border-dashed border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground sm:grid-cols-[1fr_88px] sm:items-center">
                  <span>{t("Nenhum asset enviado ainda.")}</span>
                  <div aria-hidden="true" className="relative mx-auto size-20">
                    <Image
                      alt=""
                      className="object-contain opacity-90"
                      fill
                      sizes="80px"
                      src="/brand/capyra-suitcase-standing.png"
                    />
                  </div>
                </div>
              ) : null}

              {assets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                return (
                  <div
                    key={asset.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{asset.sourceLabel}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatSourceAssetFileSize(asset.contentLength)} • {asset.analysisCount} {asset.analysisCount === 1 ? t("análise") : t("análises")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isSelected ? <Badge variant="success">{t("Selecionado")}</Badge> : null}
                      {session.status === "pending" ? (
                        <Button onClick={() => completeWithAsset(asset.id)} disabled={isPending}>
                          {isSelected ? t("Selecionado") : t("Usar este asset")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
