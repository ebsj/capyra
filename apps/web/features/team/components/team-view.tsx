"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { inviteMember, listTeam, removeMember, type Member, type Invitation } from "../api/team-api";
export function TeamView({ accessToken, owner }: { accessToken: string; owner: boolean }) {
  const { t, locale } = useI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function refresh() {
    const [m, i] = await listTeam(accessToken);
    setMembers(m.items);
    setInvitations(i.items);
  }
  useEffect(() => {
    if (owner) void refresh().catch((e) => setError(e.message));
  }, [accessToken, owner]);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  if (!owner) return <p>{t("Somente o Proprietário administra a equipe.")}</p>;
  return (
    <div className="grid gap-6">
      <p>{t("Até cinco Operadores, incluindo o Proprietário. Membros trabalham em todas as Marcas.")}</p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t("Convidar Membro")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const invite = await inviteMember(accessToken, email);
                setLink(invite.inviteUrl ?? "");
                setCopied(false);
                setEmail("");
              });
            }}
          >
            <Input className="max-w-md" type="email" required aria-label={t("E-mail do Membro")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button disabled={busy}>{t("Criar convite")}</Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("O link expira em sete dias e só pode ser usado pelo e-mail convidado. Compartilhe-o diretamente com o Membro.")}
          </p>
          {link ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Input aria-label={t("Link do convite")} readOnly value={link} />
              <Button
                variant="outline"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(link)
                    .then(() => setCopied(true))
                    .catch((e) => setError(e.message))
                }
              >
                {t(copied ? "Copiado" : "Copiar link")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("Operadores")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <p className="font-medium">
                  {m.name} · {t(m.role === "owner" ? "Proprietário" : "Membro")}
                </p>
                <p className="text-muted-foreground">{m.email}</p>
              </div>
              {m.role !== "owner" ? (
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t("Remover este Membro e revogar seu acesso?"))) void run(() => removeMember(accessToken, m.id));
                  }}
                >
                  {t("Remover")}
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("Convites")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {invitations.length === 0 ? (
            <p>{t("Nenhum convite.")}</p>
          ) : (
            invitations.map((i) => (
              <div key={i.id} className="flex flex-wrap justify-between gap-3">
                <p>
                  {i.email} · {t(i.status)} · {new Date(i.expiresAt).toLocaleString(locale)}
                </p>
                {i.status === "pending" ? (
                  <Button disabled={busy} variant="outline" onClick={() => void run(() => removeMember(accessToken, i.id, true))}>
                    {t("Revogar")}
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
