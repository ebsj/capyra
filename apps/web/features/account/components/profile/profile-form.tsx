"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/components/i18n/i18n-provider";
import type {
  AccountType,
  AuthSessionResponseContract,
  UpdateAccountProfileRequestContract,
} from "@/lib/models";
import { setClientAuthSession } from "@/lib/session";
import { updateAccountProfile } from "../../api/account-api";
import { type FieldErrors, resolveAccountFieldErrors } from "../../utils/account-field-errors";

export function ProfileForm({ session }: { session: AuthSessionResponseContract }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const accountType = session.account.accountType;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const displayName = String(formData.get("displayName") ?? "").trim();
        const ownerName = String(formData.get("ownerName") ?? "").trim();
        const nextAccountType = String(formData.get("accountType") ?? accountType) as AccountType;

        await updateAccountProfile(session.accessToken, {
          displayName,
          ownerName,
          accountType: nextAccountType,
        } satisfies UpdateAccountProfileRequestContract);

        setClientAuthSession({
          ...session,
          account: {
            ...session.account,
            displayName,
            accountType: nextAccountType,
          },
          user: {
            ...session.user,
            name: ownerName,
          },
        });

        setSuccessMessage(t("Perfil atualizado com sucesso."));
        router.refresh();
      } catch (error) {
        setFieldErrors(resolveAccountFieldErrors(error));
        setFormError(error instanceof Error ? error.message : t("Falha ao atualizar o perfil."));
      }
    });
  };

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="displayName">{t("Nome da conta")}</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={session.account.displayName}
          disabled={isPending}
        />
        {fieldErrors.displayName ? (
          <p className="text-sm text-destructive">{fieldErrors.displayName}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ownerName">{t("Responsável")}</Label>
        <Input
          id="ownerName"
          name="ownerName"
          defaultValue={session.user.name}
          disabled={isPending}
        />
        {fieldErrors.ownerName ? (
          <p className="text-sm text-destructive">{fieldErrors.ownerName}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="accountType">{t("Tipo de conta")}</Label>
        <Select name="accountType" defaultValue={accountType} disabled={isPending}>
          <SelectTrigger id="accountType">
            <SelectValue placeholder={t("Selecione um tipo")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agency">{t("Agência")}</SelectItem>
            <SelectItem value="creator">{t("Creator")}</SelectItem>
            <SelectItem value="team">{t("Equipe")}</SelectItem>
          </SelectContent>
        </Select>
        {fieldErrors.accountType ? (
          <p className="text-sm text-destructive">{fieldErrors.accountType}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">{t("Email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={session.user.email}
          disabled
          autoComplete="email"
          className="cursor-not-allowed border-border/80 bg-muted/45 text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">
          {t("O e-mail da conta não pode ser alterado aqui.")}
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("Falha ao atualizar o perfil")}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert>
          <AlertTitle>{t("Alterações salvas")}</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" className="rounded-2xl px-6" disabled={isPending}>
          {isPending ? t("Salvando...") : t("Salvar alterações")}
        </Button>
      </div>
    </form>
  );
}
