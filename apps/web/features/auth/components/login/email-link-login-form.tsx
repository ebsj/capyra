"use client";

import { APP_HOME_PATH } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGoogleAnalyticsUserId, trackGoogleAnalyticsEvent } from "@/lib/google-analytics-client";
import {
  savePendingFirebaseEmail,
  sendFirebaseEmailLink,
  readPendingFirebaseEmail,
  signInWithFirebaseGoogle,
} from "@/lib/firebase";
import { invitationTokenFromNext } from "../../utils/invitation-token";
import { normalizeNextHref } from "@/lib/navigation";
import type { FirebaseSignInRequestContract } from "@/lib/models";
import { setClientAuthSession } from "@/lib/session";
import { useI18n } from "@/components/i18n/i18n-provider";
import { signInWithFirebase } from "../../api/auth-api";
import { buildLoginResumeMessage } from "../../utils/auth-resume-message";

export function EmailLinkLoginForm({
  nextHref,
  reason,
  initialEmail,
}: {
  nextHref?: string | null;
  reason?: string | null;
  initialEmail?: string | null;
}) {
  const router = useRouter();
  const { href, t } = useI18n();
  const [isSending, setIsSending] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [email, setEmail] = useState(() => readPendingFirebaseEmail() ?? initialEmail ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const safeNextHref = normalizeNextHref(nextHref, href(APP_HOME_PATH));
  const resumeMessage = buildLoginResumeMessage(reason, t);
  const isBusy = isSending || isGoogleSigningIn;

  const handleGoogleSignIn = async () => {
    if (isBusy) {
      return;
    }

    setIsGoogleSigningIn(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const credential = await signInWithFirebaseGoogle();
      const idToken = await credential.user.getIdToken();
      const response = await signInWithFirebase({
        idToken,
        invitationToken: invitationTokenFromNext(safeNextHref),
      } satisfies FirebaseSignInRequestContract);

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
        method: "google",
      });

      router.replace(invitationTokenFromNext(safeNextHref) ? href("/brands") : safeNextHref);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Falha ao entrar com Google."));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) {
      return;
    }

    setIsSending(true);
    setFormError(null);
    setSuccessMessage(null);

    const candidateEmail = email.trim().toLowerCase();

    if (!candidateEmail) {
      setFormError(t("Informe o e-mail para receber o link de acesso."));
      setIsSending(false);
      return;
    }

    try {
      await sendFirebaseEmailLink(candidateEmail, safeNextHref);
      savePendingFirebaseEmail(candidateEmail);
      setSuccessMessage(t("Enviamos um link de acesso para {email}.", { email: candidateEmail }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("Falha ao enviar o link de acesso."));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-foreground/5">
      <CardHeader className="gap-4 border-b border-border/70 bg-background/70">
        {/* <div className="flex flex-wrap items-center gap-2">
          {safeNextHref !== APP_HOME_PATH ? (
            <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
              {t("retorno para {href}", { href: safeNextHref })}
            </Badge>
          ) : null}
        </div> */}
        <div className="grid gap-2">
          <CardTitle className="font-display text-3xl">{t("Entre com Google ou link de uso único")}</CardTitle>
          <CardDescription className="max-w-lg text-sm leading-6">
            {t("Use sua conta Google ou digite seu e-mail para receber um link de acesso e continuar de onde parou.")}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-6">
        {resumeMessage ? (
          <Alert>
            <AlertTitle>{resumeMessage.title}</AlertTitle>
            <AlertDescription>{resumeMessage.description}</AlertDescription>
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert>
            <AlertTitle>{t("Link enviado")}</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form className="grid gap-4" method="post" onSubmit={handleSubmit}>
          <input name="csrfToken" type="hidden" />
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
          </div>

          {formError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("Falha ao enviar")}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full rounded-2xl" disabled={isBusy}>
            {isSending ? t("Enviando link...") : successMessage ? t("Reenviar link") : t("Enviar link")}
          </Button>
        </form>

        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("ou")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-2xl"
            disabled={isBusy}
            onClick={handleGoogleSignIn}
          >
            {isGoogleSigningIn ? t("Abrindo Google...") : t("Entrar com Google")}
          </Button>
        </div>
      </CardContent>

    </Card>
  );
}
