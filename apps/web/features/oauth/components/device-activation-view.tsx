"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/components/i18n/i18n-provider";
import { activateOAuthDeviceCode } from "../api/activate-oauth-device-code";

type Props = {
  accessToken: string;
  clientId: string | null;
  userCode: string;
};

export function DeviceActivationView({ accessToken, clientId, userCode }: Props) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const clientLabel =
    clientId === "capyra-mcp"
      ? t("Capyra MCP para ChatGPT, Claude ou outro cliente compatível")
      : clientId === "capyra-cli"
        ? "Capyra CLI"
        : clientId ?? t("Cliente externo");
  const returnTarget = clientId === "capyra-mcp" ? t("ao ChatGPT, Claude ou ao host MCP") : t("ao cliente externo");

  const activate = () => {
    if (!userCode.trim()) {
      setError(t("O parâmetro user_code é obrigatório."));
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await activateOAuthDeviceCode(accessToken, { userCode });
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Falha ao autorizar o device code."));
      }
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
      <Card className="w-full rounded-[2rem] border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="font-display text-3xl">{t("Autorizar acesso externo")}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("Confirme este device code para liberar o uso da Capyra em {clientLabel}.", { clientLabel })}
          </p>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Device code</p>
            <p className="mt-2 font-mono text-2xl text-foreground">{userCode || t("ausente")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("Aplicativo: {clientLabel}", { clientLabel })}</p>
          </div>

          {status === "success" ? (
            <Alert>
              <AlertTitle>{t("Autorização concluída")}</AlertTitle>
              <AlertDescription>{t("Você já pode voltar {returnTarget}. O login poderá ser concluído por lá.", { returnTarget })}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{t("Falha ao autorizar")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={activate} disabled={isPending || status === "success"}>
            {isPending ? t("Autorizando...") : status === "success" ? t("Autorizado") : t("Autorizar acesso")}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
