"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { acceptInvitation } from "../api/team-api";
export function AcceptInvitationView({ accessToken, token }: { accessToken: string; token: string }) {
  const { t, href } = useI18n();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-4">
      <h1 className="font-display text-2xl">{t("Convite para a equipe")}</h1>
      <p>{t("O convite está vinculado ao e-mail autenticado e não permite participar de duas Contas Capyra.")}</p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {done ? (
        <>
          <p>{t("Convite aceito.")}</p>
          <Button asChild>
            <Link href={href("/brands")}>{t("Ir para Marcas")}</Link>
          </Button>
        </>
      ) : (
        <Button
          disabled={busy || !token}
          onClick={async () => {
            setBusy(true);
            try {
              await acceptInvitation(accessToken, token);
              setDone(true);
            } catch (e) {
              setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("Aceitar convite")}
        </Button>
      )}
    </div>
  );
}
