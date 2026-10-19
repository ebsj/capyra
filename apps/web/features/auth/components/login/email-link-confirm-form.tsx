"use client";

import { APP_HOME_PATH } from "@/lib/features";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGoogleAnalyticsUserId, trackGoogleAnalyticsEvent } from "@/lib/google-analytics-client";
import {
  clearPendingFirebaseEmail,
  isFirebaseEmailLink,
  readPendingFirebaseEmail,
  signInWithFirebaseEmailLink,
} from "@/lib/firebase";
import { invitationTokenFromNext } from "../../utils/invitation-token";
import { normalizeNextHref } from "@/lib/navigation";
import type { FirebaseEmailLinkSignInRequestContract } from "@/lib/models";
import { setClientAuthSession } from "@/lib/session";
import { useI18n } from "@/components/i18n/i18n-provider";
import { signInWithFirebaseEmailLink as createEmailLinkSession } from "../../api/auth-api";

type EmailLinkStatus = "checking" | "needs-email" | "verifying" | "invalid-link";

export function EmailLinkConfirmForm({ nextHref }: { nextHref?: string | null }) {
  const router = useRouter();
  const { href, t } = useI18n();
  const [status, setStatus] = useState<EmailLinkStatus>("checking");
  const [email, setEmail] = useState(() => readPendingFirebaseEmail() ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const safeNextHref = normalizeNextHref(nextHref, href(APP_HOME_PATH));
  const didBootstrap = useRef(false);

  const completeSignIn = async (candidateEmail: string) => {
    const emailLink = window.location.href;
    const normalizedEmail = candidateEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setFieldError(t("Informe o e-mail usado para receber o link."));
      setStatus("needs-email");
      return;
    }

    if (!isFirebaseEmailLink(emailLink)) {
      setStatus("invalid-link");
      setFormError(t("Este endereço não contém um link válido do Firebase."));
      return;
    }

    setFieldError(null);
    setFormError(null);
    setStatus("verifying");

    try {
      const credential = await signInWithFirebaseEmailLink(normalizedEmail, emailLink);
      const idToken = await credential.user.getIdToken();
      const response = await createEmailLinkSession({
        idToken,
        invitationToken: invitationTokenFromNext(safeNextHref),
      } satisfies FirebaseEmailLinkSignInRequestContract);

      setClientAuthSession({
        accessToken: response.accessToken,
        tokenType: response.tokenType,
        expiresAt: response.expiresAt,
        account: response.account,
        user: response.user,
        brands: response.brands,
      });
      setGoogleAnalyticsUserId(response.user.id);
      trackGoogleAnalyticsEvent("login", {
        account_type: response.account.accountType,
        method: "email_link",
      });

      clearPendingFirebaseEmail();
      router.replace(invitationTokenFromNext(safeNextHref) ? href("/brands") : safeNextHref);
    } catch (error) {
      clearPendingFirebaseEmail();
      setStatus("needs-email");
      setFormError(error instanceof Error ? error.message : t("Falha ao concluir o login."));
    }
  };

  useEffect(() => {
    if (didBootstrap.current) {
      return;
    }

    didBootstrap.current = true;

    if (typeof window === "undefined") {
      return;
    }

    if (!isFirebaseEmailLink(window.location.href)) {
      setStatus("invalid-link");
      setFormError(t("Este link não parece ser um link de autenticação do Firebase."));
      return;
    }

    const pendingEmail = readPendingFirebaseEmail();
    if (pendingEmail) {
      setEmail(pendingEmail);
      void completeSignIn(pendingEmail);
      return;
    }

    setStatus("needs-email");
  }, [safeNextHref]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void completeSignIn(email);
  };

  const isVerifying = status === "verifying";
  const isBusy = status === "checking" || isVerifying;

  return (
    <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-foreground/5">
      <CardHeader className="gap-4 border-b border-border/70 bg-background/70">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
            {t("Confirmar acesso")}
          </Badge>
          <Badge variant="secondary">{t("email link")}</Badge>
          {safeNextHref !== APP_HOME_PATH ? (
            <Badge variant="outline">{invitationTokenFromNext(safeNextHref) ? t("Convite para a equipe") : t("retorno para {href}", { href: safeNextHref })}</Badge>
          ) : null}
        </div>
        <div className="grid gap-2">
          <CardTitle className="font-display text-3xl">{t("Conclua o login com o link recebido")}</CardTitle>
          <CardDescription className="max-w-lg text-sm leading-6">
            {t("Se o link abriu neste dispositivo, o e-mail salvo é usado automaticamente. Caso contrário, digite o mesmo endereço para validar a sessão com segurança.")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-6">
        {status === "checking" ? (
          <Alert>
            <AlertTitle>{t("Verificando link")}</AlertTitle>
            <AlertDescription>
              {t("Estamos lendo o código do Firebase e preparando a conclusão da autenticação.")}
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "invalid-link" ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Link inválido")}</AlertTitle>
            <AlertDescription>
              {formError ?? t("Abra novamente o e-mail de login para gerar um novo link de acesso.")}
            </AlertDescription>
          </Alert>
        ) : null}

        {status !== "invalid-link" ? (
          <>
            {formError && status !== "checking" ? (
              <Alert variant="destructive">
                <AlertTitle>{t("Não foi possível concluir")}</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}

            {status === "verifying" ? (
              <Alert>
                <AlertTitle>{t("Validando credenciais")}</AlertTitle>
                <AlertDescription>
                  {t("O Firebase confirmou o link. Agora a sessão da Capyra está sendo criada.")}
                </AlertDescription>
              </Alert>
            ) : null}

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("Email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="owner@capyra.dev"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isBusy}
                  autoComplete="email"
                />
                {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
              </div>

              <Button type="submit" className="w-full rounded-2xl" disabled={isBusy}>
                {isVerifying ? t("Concluindo acesso...") : t("Concluir login")}
              </Button>
            </form>
          </>
        ) : null}
      </CardContent>

      <CardFooter className="flex-col items-start gap-4 border-t border-border/70 bg-background/50">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">signInWithEmailLink</Badge>
          <Badge variant="outline">{t("same email required")}</Badge>
          <Badge variant="outline">Capyra {t("Sessão")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Voltar para")}{" "}
          <Link href={`${href("/login")}?next=${encodeURIComponent(safeNextHref)}`} className="font-medium text-foreground underline underline-offset-4">
            {t("o login")}
          </Link>
          .
        </p>
      </CardFooter>
    </Card>
  );
}
