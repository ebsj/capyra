"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { listNotifications, markNotificationRead, listAuditEvents, type Notification, type AuditEvent } from "../api/notifications-api";
export function NotificationsView({ accessToken, owner }: { accessToken: string; owner: boolean }) {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Notification[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [auditCursor, setAuditCursor] = useState<string>();
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const n = await listNotifications(accessToken);
      setItems(n.items);
      setCursor(n.nextCursor);
      if (owner) {
        const a = await listAuditEvents(accessToken);
        setEvents(a.items);
        setAuditCursor(a.nextCursor);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    }
  }
  useEffect(() => {
    void refresh();
  }, [accessToken, owner]);
  return (
    <div className="grid gap-5">
      <Button variant="outline" onClick={() => void refresh()}>
        {t("Atualizar")}
      </Button>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("Notificações")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {items.length === 0 ? (
            <p>{t("Nenhuma notificação.")}</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className="grid gap-2 border-b pb-3">
                <p className={n.readAt ? "text-muted-foreground" : "font-medium"}>{n.message}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString(locale)} · {n.code}
                </p>
                {!n.readAt ? (
                  <Button
                    variant="outline"
                    className="justify-self-start"
                    onClick={async () => {
                      try {
                        await markNotificationRead(accessToken, n.id);
                        await refresh();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
                      }
                    }}
                  >
                    {t("Marcar como lida")}
                  </Button>
                ) : null}
              </div>
            ))
          )}
          {cursor ? (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const n = await listNotifications(accessToken, cursor);
                  setItems((v) => [...v, ...n.items]);
                  setCursor(n.nextCursor);
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
                }
              }}
            >
              {t("Carregar mais")}
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {owner ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("Auditoria")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t("Ações sensíveis são preservadas por doze meses, sem credenciais ou conteúdo de mídia.")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {["Ação", "Operador", "Recurso", "Data", "Correlação"].map((k) => (
                      <th className="p-2" key={k}>
                        {t(k)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2">{a.action}</td>
                      <td className="p-2 break-all">{a.actorId}</td>
                      <td className="p-2 break-all">
                        {a.resourceType}
                        <br />
                        {a.resourceId}
                      </td>
                      <td className="p-2">{new Date(a.createdAt).toLocaleString(locale)}</td>
                      <td className="p-2 break-all">{a.correlationId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {auditCursor ? (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const a = await listAuditEvents(accessToken, auditCursor);
                    setEvents((v) => [...v, ...a.items]);
                    setAuditCursor(a.nextCursor);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
                  }
                }}
              >
                {t("Carregar mais")}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
