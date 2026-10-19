"use client";

import { Building2, Mail, UserRound } from "lucide-react";

import { useI18n } from "@/components/i18n/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthSessionResponseContract } from "@/lib/models";
import { ProfileForm } from "./profile-form";

export function ProfileView({ session }: { session: AuthSessionResponseContract }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="rounded-[2rem] border-border bg-card/95 shadow-xl shadow-foreground/5 overflow-hidden">
        <CardHeader className="gap-3 border-b border-border/70 bg-background/60">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-5" />
            </div>
            <div className="grid gap-1">
              <CardTitle className="font-display text-3xl text-foreground">
                {t("Perfil")}
              </CardTitle>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {t("Atualize os dados principais da conta e mantenha o workspace alinhado com quem opera nele.")}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {session.user.role === "owner" ? <ProfileForm session={session} /> : <p>{t("Somente o Proprietário altera os dados da Conta Capyra.")}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 self-start">
        <Card className="rounded-[1.75rem] border-border bg-surface-strong shadow-sm">
          <CardContent className="grid gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Conta")}
                </p>
                <p className="truncate font-semibold text-foreground">
                  {session.account.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Responsável")}
                </p>
                <p className="truncate font-semibold text-foreground">
                  {session.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t("Email")}
                </p>
                <p className="truncate font-semibold text-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
