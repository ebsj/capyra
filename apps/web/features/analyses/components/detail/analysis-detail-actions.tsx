"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisDetailResponseContract } from "@/lib/models";
import { ApiError } from "@/lib/http";
import { deleteAnalysis } from "../../api/delete-analysis";

import { formatAnalysisSource } from "../../utils/analysis-utils";

type FailedAnalysisRecoveryState = {
  title: string;
  description: ReactNode;
};

const AUTH_REQUIRED_ERROR_MARKERS = [
  "requires authentication for this video url",
  "configured yt-dlp cookies were rejected",
  "upload the video file directly",
];

export function PendingAnalysisRefresher({
  status,
}: {
  status: AnalysisDetailResponseContract["status"];
}) {
  const router = useRouter();

  useEffect(() => {
    if (status !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router, status]);

  if (status !== "pending") {
    return null;
  }

  return <span className="sr-only">Atualizando a análise pendente.</span>;
}

export function getFailedAnalysisRecoveryState(
  analysis: AnalysisDetailResponseContract,
  t: (source: string, values?: Record<string, string | number>) => string = (source) => source,
): FailedAnalysisRecoveryState | null {
  if (analysis.status !== "failed") {
    return null;
  }

  const errorMessage = analysis.errorMessage?.trim();
  if (!errorMessage) {
    return {
      title: t("A análise falhou antes de gerar o relatório"),
      description: t("Volte ao workspace e tente novamente a partir da origem do vídeo."),
    };
  }

  const isAuthRequiredFailure =
    (analysis.sourceType === "public_url" || analysis.sourceType === "public_url_best_effort") &&
    AUTH_REQUIRED_ERROR_MARKERS.some((marker) => errorMessage.toLowerCase().includes(marker));

  if (isAuthRequiredFailure) {
    const sourceLabel =
      analysis.platform === "instagram_reels" ||
      analysis.sourceLabel.toLowerCase().includes("instagram.com")
        ? t("o Reel do Instagram")
        : t("a URL pública do vídeo");

    return {
      title: t("A URL exigiu autenticação antes do download"),
      description: (
        <>
          {errorMessage} {t("Volte ao workspace e use a aba")} <strong>{t("Enviar arquivo")}</strong> {t("para continuar sem depender do download por URL de {sourceLabel}.", { sourceLabel })}
        </>
      ),
    };
  }

  return {
    title: t("A análise falhou antes de gerar o relatório"),
    description: errorMessage,
  };
}

export function DeleteAnalysisDialog({ analysis }: { analysis: AnalysisDetailResponseContract }) {
  const router = useRouter();
  const { href, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteAnalysis(analysis.id);
        setOpen(false);
        router.replace(href("/analyses"));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setOpen(false);
          router.replace(href("/analyses"));
          return;
        }

        setDeleteError(error instanceof Error ? error.message : t("Falha ao excluir a análise."));
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) {
          return;
        }

        setOpen(nextOpen);
        if (!nextOpen) {
          setDeleteError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 data-icon="inline-start" />
          {t("Excluir")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" closeLabel={t("Fechar")}>
        <DialogHeader className="gap-3">
          <DialogTitle>{t("Excluir análise")}</DialogTitle>
          <DialogDescription className="break-words">
            {t("Esta análise deixará de aparecer no histórico e no detalhe do workspace.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-[1.25rem] border border-border bg-card/60 p-4 text-sm leading-6 text-muted-foreground">
          <p className="break-words">
            <span className="font-medium text-foreground">{t("Análise:")}</span> {analysis.summary}
          </p>
          <p className="break-words">
            <span className="font-medium text-foreground">{t("Origem:")}</span>{" "}
            {formatAnalysisSource(analysis.sourceLabel, analysis.sourceUrl)}
          </p>
        </div>

        {deleteError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Não foi possível excluir")}</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            {t("Cancelar")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? t("Excluindo...") : t("Confirmar exclusão")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
