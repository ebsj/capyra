"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Destination, Preflight } from "../types/social";
import { actOnDestination, preflightDestination } from "../api/social-api";
import { DestinationHistory } from "./destination-history";
import { canCancel, canEdit, stateLabels, formatLabels } from "../utils/state";
export function DestinationCard({
  destination: d,
  accessToken,
  timeZone,
  editable,
  onEdit,
  onChanged,
}: {
  destination: Destination;
  accessToken: string;
  timeZone: string;
  editable: boolean;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const { t, locale } = useI18n();
  const [localTime, setLocalTime] = useState("");
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const keys = useRef<Record<string, string>>({});
  async function run(action: "preflight" | "submit" | "cancel" | "retry", publishNow = true) {
    setBusy(true);
    setError("");
    try {
      if (action === "preflight") {
        setPreflight(await preflightDestination(accessToken, d.publicationId, d.id));
        return;
      }
      if (action === "submit") {
        const p = await preflightDestination(accessToken, d.publicationId, d.id);
        setPreflight(p);
        if (!p.valid) return;
      }
      const keyName = `${action}:${publishNow}:${localTime}`;
      const key = (keys.current[keyName] ??= crypto.randomUUID());
      await actOnDestination(
        accessToken,
        d.publicationId,
        d.id,
        action,
        key,
        action === "submit" ? { publishNow, localDateTime: publishNow ? undefined : localTime } : undefined
      );
      delete keys.current[keyName];
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap justify-between gap-3">
          <CardTitle className="capitalize">
            {d.platform} · {t(formatLabels[d.format] ?? d.format)}
          </CardTitle>
          <Badge variant={d.status === "failed" ? "destructive" : "outline"}>{t(stateLabels[d.status] ?? d.status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <h3 className="font-medium">{d.title}</h3>
        <p className="whitespace-pre-wrap">{d.content}</p>
        <p className="text-muted-foreground">{d.description}</p>
        {d.scheduledAt ? (
          <p>
            {new Date(d.scheduledAt).toLocaleString(locale, { timeZone: d.timeZone ?? timeZone })} · {d.timeZone ?? timeZone}
          </p>
        ) : null}
        {d.status === "unknown" ? (
          <p role="status" className="rounded border border-warning p-3">
            {t("O resultado ainda não foi confirmado. Aguarde a reconciliação antes de qualquer nova tentativa.")}
          </p>
        ) : null}
        {d.status === "cancellation_requested" ? (
          <p role="status">{t("Cancelamento solicitado. A publicação ainda não está confirmada como cancelada.")}</p>
        ) : null}
        {d.lastError ? <p className="text-destructive">{d.lastError}</p> : null}
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        {preflight ? (
          <div role="status" className="rounded-xl border p-3">
            <p className="font-medium">{t(preflight.valid ? "Validação aprovada" : "Corrija antes de publicar")}</p>
            {preflight.issues.map((i, n) => (
              <p key={`${i.code}:${n}`}>
                {i.field}: {i.message}
              </p>
            ))}
          </div>
        ) : null}
        {editable ? (
          <div className="flex flex-wrap gap-2">
            {canEdit(d.status) ? (
              <>
                <Button variant="outline" disabled={busy} onClick={onEdit}>
                  {t("Editar rascunho")}
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => void run("preflight")}>
                  {t("Validar Destino")}
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t("Publicar este Destino agora?"))) void run("submit");
                  }}
                >
                  {t("Publicar agora")}
                </Button>
              </>
            ) : null}
            {canCancel(d.status) ? (
              <Button variant="outline" disabled={busy} onClick={() => void run("cancel")}>
                {t("Solicitar cancelamento")}
              </Button>
            ) : null}
            {d.status === "failed" ? (
              <Button disabled={busy} onClick={() => void run("retry")}>
                {t("Repetir somente este Destino")}
              </Button>
            ) : null}
          </div>
        ) : null}
        {editable && canEdit(d.status) ? (
          <div className="grid gap-2 rounded-xl border p-4">
            <label>
              {t("Agendar no fuso da Marca")} · {timeZone}
              <Input aria-label={t("Data e hora local")} type="datetime-local" value={localTime} onChange={(e) => setLocalTime(e.target.value)} />
            </label>
            <p className="text-sm text-muted-foreground">
              {t("Horários inexistentes ou ambíguos de horário de verão serão recusados. Alterar o fuso depois não desloca este agendamento.")}
            </p>
            <Button disabled={busy || !localTime} onClick={() => void run("submit", false)}>
              {t("Agendar Destino")}
            </Button>
          </div>
        ) : null}
        {!canEdit(d.status) && editable && d.status === "scheduled" ? (
          <p className="text-sm">{t("Para editar, solicite o cancelamento e aguarde sua confirmação.")}</p>
        ) : null}
        <DestinationHistory destination={d} />
      </CardContent>
    </Card>
  );
}
