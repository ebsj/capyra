"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getUsage, type Usage } from "../api/usage-api";
export function UsageView({ accessToken }: { accessToken: string }) {
  const { t, locale } = useI18n();
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setUsage(await getUsage(accessToken));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    }
  }
  useEffect(() => {
    void refresh();
  }, [accessToken]);
  const labels = { brands: "Marcas ativas", socialIdentities: "Identidades sociais do ciclo", operators: "Operadores", analyses: "Análises concluídas" };
  return (
    <div className="grid gap-5">
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {usage ? (
        <>
          <p>
            {t("Ciclo")}: {new Date(usage.cycleStart).toLocaleDateString(locale)} — {new Date(usage.cycleEnd).toLocaleDateString(locale)} ·{" "}
            {t(usage.subscriptionStatus)}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
              <Card key={k}>
                <CardHeader>
                  <CardTitle className="text-base">{t(labels[k])}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl">
                    {usage.usage[k]} / {usage.limits[k]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t("Créditos de análise")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p>
                {t("Incluídos disponíveis")}: {usage.credits.includedRemaining}
              </p>
              <p>
                {t("Pacotes disponíveis")}: {usage.credits.purchasedRemaining}
              </p>
              <p>
                {t("Reservados")}: {usage.usage.reservedAnalyses}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(
                  "O aceite reserva um crédito; apenas o relatório completo consome. Falhas técnicas liberam a reserva. Créditos incluídos expiram no ciclo; pacotes são usados depois e permanecem enquanto a assinatura estiver ativa."
                )}
              </p>
            </CardContent>
          </Card>
          <p className="text-muted-foreground">
            {t("Identidades desconectadas continuam contando neste ciclo. Reconectar a mesma identidade não consome outra unidade.")}
          </p>
          <p>{t("Compras adicionais e faturamento são provisionados manualmente. Não há cobrança automática nesta tela.")}</p>
        </>
      ) : null}
      <Button variant="outline" onClick={() => void refresh()}>
        {t("Atualizar")}
      </Button>
    </div>
  );
}
