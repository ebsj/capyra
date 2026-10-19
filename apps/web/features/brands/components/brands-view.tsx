"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/i18n-provider";
import { saveBrand, changeBrandStatus, listBrands } from "../api/brands-api";
import type { Brand } from "../types/brand";
export function BrandsView({ accessToken, initialBrands, owner }: { accessToken: string; initialBrands: Brand[]; owner: boolean }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [editing, setEditing] = useState<string>();
  const [name, setName] = useState("");
  const [zone, setZone] = useState("America/Recife");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      setBrands((await listBrands(accessToken)).items);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6">
      <p className="text-muted-foreground">{t("Organize conteúdo, análises e conexões por Marca. Confirme o nome e o fuso antes de agendar.")}</p>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      {owner ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? t("Editar Marca") : t("Nova Marca")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await saveBrand(accessToken, { name, timeZone: zone, confirmed: true }, editing);
                  setEditing(undefined);
                  setName("");
                });
              }}
            >
              <label>
                {t("Nome")}
                <Input required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                {t("Fuso IANA")}
                <Input required value={zone} onChange={(e) => setZone(e.target.value)} placeholder="America/Recife" list="brand-time-zones" />
                <datalist id="brand-time-zones">
                  {["America/Recife", "America/Sao_Paulo", "America/New_York", "Europe/Lisbon", "UTC"].map((z) => (
                    <option key={z} value={z} />
                  ))}
                </datalist>
              </label>
              <Button className="self-end" disabled={busy}>
                {t("Salvar e confirmar")}
              </Button>
            </form>
            {editing ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(undefined);
                  setName("");
                }}
              >
                {t("Cancelar edição")}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {brands.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{b.name}</CardTitle>
                <Badge variant="outline">{t(b.status === "active" ? "Ativa" : b.status === "archiving" ? "Arquivamento em andamento" : "Arquivada")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p>
                {b.timeZone} · {t(b.confirmedAt ? "Fuso confirmado" : "Confirmação necessária")}
              </p>
              {b.status === "archived" ? (
                <p className="text-sm text-muted-foreground">
                  {t("Histórico preservado. Mídias originais expiram após 30 dias. A restauração exige novas conexões.")}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={href(`/brands/${b.id}/connections`)}>{t("Conexões")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={href(`/social-publications?brandId=${b.id}`)}>{t("Publicações")}</Link>
                </Button>
                {owner && b.status === "active" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(b.id);
                        setName(b.name);
                        setZone(b.timeZone);
                      }}
                    >
                      {t("Editar / confirmar")}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(t("Arquivar esta Marca? Destinos futuros serão cancelados e conexões encerradas após confirmação.")))
                          void run(() => changeBrandStatus(accessToken, b.id, "archive"));
                      }}
                    >
                      {t("Arquivar")}
                    </Button>
                  </>
                ) : null}
                {owner && b.status === "archived" ? (
                  <Button disabled={busy} onClick={() => void run(() => changeBrandStatus(accessToken, b.id, "restore"))}>
                    {t("Restaurar")}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button variant="ghost" disabled={busy} onClick={() => void run(async () => {})}>
        {t("Atualizar")}
      </Button>
    </div>
  );
}
