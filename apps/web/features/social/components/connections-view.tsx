"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Brand } from "@/features/brands";
import { listConnections, connectSocial, disconnectSocial, getCapabilities, syncSocial } from "../api/social-api";
import type { SocialAccount, Platform, Capabilities } from "../types/social";
import { stateLabels, formatLabels } from "../utils/state";
export function ConnectionsView({ accessToken, brand, owner }: { accessToken: string; brand: Brand; owner: boolean }) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [caps, setCaps] = useState<Record<string, Capabilities>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    setAccounts((await listConnections(accessToken, brand.id)).items);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, [accessToken, brand.id]);
  async function run(work: () => Promise<unknown>) {
    setError("");
    setMessage("");
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
    <div className="grid gap-5">
      <h2 className="font-display text-2xl">{brand.name}</h2>
      <p className="text-muted-foreground">{t("Uma Conta social por rede. A reconexão preserva a mesma identidade; para trocar, desconecte primeiro.")}</p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {message ? <p role="status">{message}</p> : null}
      {!owner ? <p>{t("Somente o Proprietário administra conexões.")}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {(["instagram", "tiktok", "youtube"] as Platform[]).map((platform) => {
          const a = accounts.find((a) => a.platform === platform && a.status !== "disconnected");
          return (
            <Card key={platform}>
              <CardHeader>
                <CardTitle className="capitalize">{platform}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                {a ? (
                  <>
                    <p className="font-medium">{a.displayName}</p>
                    <Badge variant="outline">{t(stateLabels[a.status] ?? a.status)}</Badge>
                    <p>{t(a.identityStatus === "verified" ? "Identidade verificada" : "Identidade não verificada: publicação bloqueada")}</p>
                    {caps[a.id] ? (
                      <div className="text-sm">
                        <p>{caps[a.id].formats.map((f) => t(formatLabels[f] ?? f)).join(" · ")}</p>
                        {Object.entries(caps[a.id].limits).map(([key, value]) => (
                          <p key={key}>
                            {t(key)}: {value}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const c = await getCapabilities(accessToken, a.id);
                          setCaps((v) => ({ ...v, [a.id]: c }));
                        })
                      }
                    >
                      {t("Consultar capacidades")}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || brand.status !== "active" || a.status !== "active"}
                      onClick={() =>
                        void run(async () => {
                          await syncSocial(accessToken, a.id);
                          setMessage(t("Sincronização solicitada."));
                        })
                      }
                    >
                      {t("Sincronizar histórico")}
                    </Button>
                    {owner && brand.status === "active" ? (
                      <>
                        <Button
                          disabled={busy || a.identityStatus !== "verified" || a.status === "disconnecting"}
                          onClick={() =>
                            void run(async () => {
                              const s = await connectSocial(accessToken, brand.id, platform, a.id);
                              window.location.assign(s.authorizationUrl);
                            })
                          }
                        >
                          {t("Reconectar mesma identidade")}
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={busy || a.status === "disconnecting"}
                          onClick={() => {
                            if (window.confirm(t("Desconectar? Os Destinos futuros precisam ter cancelamento confirmado.")))
                              void run(() => disconnectSocial(accessToken, a.id));
                          }}
                        >
                          {t("Desconectar")}
                        </Button>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p>{t("Nenhuma conexão ativa.")}</p>
                    {owner ? (
                      <Button
                        disabled={busy || brand.status !== "active"}
                        onClick={() =>
                          void run(async () => {
                            const s = await connectSocial(accessToken, brand.id, platform);
                            window.location.assign(s.authorizationUrl);
                          })
                        }
                      >
                        {t("Conectar")}
                      </Button>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button variant="ghost" disabled={busy} onClick={() => void run(refresh)}>
        {t("Atualizar")}
      </Button>
    </div>
  );
}
