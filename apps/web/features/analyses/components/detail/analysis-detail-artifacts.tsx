import {
  Download,
  ExternalLink,
  FileAudio2,
  FileJson2,
  FileVideo2,
  Image as ImageIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AnalysisArtifactItemContract } from "@/lib/models";
import { cn } from "@/lib/utils";

import { EmptyInlineState } from "./analysis-detail-shared";
import {
  buildArtifactPreviewMetadata,
  buildArtifactSections,
  getArtifactSectionTitle,
  isFrameArtifact,
} from "../../utils/analysis-artifact-utils";

function ArtifactIcon({ item }: { item: AnalysisArtifactItemContract }) {
  switch (item.category) {
    case "video":
      return <FileVideo2 className="size-5" />;
    case "audio":
      return <FileAudio2 className="size-5" />;
    case "frame":
      return <ImageIcon className="size-5" />;
    case "report":
    case "manifest":
      return <FileJson2 className="size-5" />;
    default:
      return <FileJson2 className="size-5" />;
  }
}

function ArtifactPreview({ item }: { item: AnalysisArtifactItemContract }) {
  if (isFrameArtifact(item)) {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-border bg-muted/20">
        <img
          src={item.previewUrl}
          alt={item.fileName}
          loading="eager"
          decoding="async"
          className="max-h-[70vh] w-full object-contain"
        />
      </div>
    );
  }

  if (item.category === "video") {
    return (
      <video
        controls
        preload="none"
        src={item.previewUrl}
        className="max-h-[70vh] w-full rounded-[1.5rem] border border-border bg-foreground"
      />
    );
  }

  if (item.category === "audio") {
    return (
      <div className="rounded-[1.5rem] border border-border bg-background/80 p-5">
        <audio controls preload="none" src={item.previewUrl} className="w-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-background/70 text-muted-foreground">
      <ArtifactIcon item={item} />
    </div>
  );
}

function ArtifactTile({ item }: { item: AnalysisArtifactItemContract }) {
  const { t } = useI18n();
  const preview = buildArtifactPreviewMetadata(item);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group grid min-h-36 overflow-hidden rounded-[1.35rem] border border-border bg-card/88 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="relative aspect-video bg-background/70">
            {isFrameArtifact(item) ? (
              <img
                src={item.previewUrl}
                alt={item.fileName}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-primary">
                <ArtifactIcon item={item} />
              </div>
            )}
          </div>
          <div className="grid gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="brandSoft">{preview.sectionTitle}</Badge>
              <span className="truncate text-xs text-muted-foreground">{item.mimeType}</span>
            </div>
            <p className="line-clamp-2 break-words text-sm font-semibold leading-5 text-foreground">
              {item.fileName}
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] max-w-[min(980px,calc(100vw-2rem))] overflow-y-auto"
        closeLabel={t("Fechar")}
      >
        <DialogHeader>
          <DialogTitle className="break-words text-xl">{item.fileName}</DialogTitle>
          <DialogDescription className="break-words">
            {preview.description} · {item.mimeType}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ArtifactPreview item={item} />
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <p className="break-all">
              <span className="font-medium text-foreground">{t("Caminho:")}</span> {item.path}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("Categoria:")}</span> {item.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={item.downloadUrl} download={item.fileName}>
                <Download data-icon="inline-start" />
                {t("Baixar")}
              </a>
            </Button>
            <Button asChild variant="ghost" className="rounded-2xl">
              <a href={item.previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" />
                {t("Abrir")}
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MediaAssetRow({ item }: { item: AnalysisArtifactItemContract }) {
  const { t } = useI18n();
  const preview = buildArtifactPreviewMetadata(item);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="grid w-full gap-3 border-t border-border/70 py-4 text-left first:border-t-0 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:items-center"
        >
          <span className="flex size-12 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
            <ArtifactIcon item={item} />
          </span>
          <span className="min-w-0">
            <span className="block break-words font-semibold text-foreground">{item.fileName}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{preview.sectionTitle} · {item.mimeType}</span>
          </span>
          <span className={cn(buttonVariants({ variant: "ghost" }), "w-fit rounded-2xl")}>{t("Abrir")}</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] max-w-[min(980px,calc(100vw-2rem))] overflow-y-auto"
        closeLabel={t("Fechar")}
      >
        <DialogHeader>
          <DialogTitle className="break-words text-xl">{item.fileName}</DialogTitle>
          <DialogDescription className="break-words">
            {preview.description} · {item.mimeType}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ArtifactPreview item={item} />
          <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
            <p className="break-all">
              <span className="font-medium text-foreground">{t("Caminho:")}</span> {item.path}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("Categoria:")}</span> {item.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <a href={item.downloadUrl} download={item.fileName}>
                <Download data-icon="inline-start" />
                {t("Baixar")}
              </a>
            </Button>
            <Button asChild variant="ghost" className="rounded-2xl">
              <a href={item.previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" />
                {t("Abrir")}
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FileAssetRow({ item }: { item: AnalysisArtifactItemContract }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-3 border-t border-border/70 py-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="break-words font-semibold text-foreground">{item.fileName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{getArtifactSectionTitle(item.category)} · {item.mimeType}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-2xl">
          <a href={item.downloadUrl} download={item.fileName}>
            <Download data-icon="inline-start" />
            {t("Baixar")}
          </a>
        </Button>
        <Button asChild variant="ghost" className="rounded-2xl">
          <a href={item.previewUrl} target="_blank" rel="noreferrer">
            <ExternalLink data-icon="inline-start" />
            {t("Abrir")}
          </a>
        </Button>
      </div>
    </div>
  );
}

export function ArtifactsPanel({
  artifactSections,
}: {
  artifactSections: ReturnType<typeof buildArtifactSections>;
}) {
  const { t } = useI18n();

  const mediaItems = artifactSections
    .filter((section) => section.category === "video" || section.category === "audio")
    .flatMap((section) => section.items);
  const frameItems = artifactSections.find((section) => section.category === "frame")?.items ?? [];
  const fileItems = artifactSections
    .filter((section) => section.category !== "video" && section.category !== "audio" && section.category !== "frame")
    .flatMap((section) => section.items);

  if (artifactSections.length === 0) {
    return (
      <EmptyInlineState title={t("Nenhum artefato disponível.")} />
    );
  }

  return (
    <div className="grid gap-8">
      {mediaItems.length > 0 ? (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-foreground">{t("Vídeo e áudio")}</h3>
          </div>
          <div>{mediaItems.map((item) => <MediaAssetRow key={`${item.category}-${item.path}`} item={item} />)}</div>
        </section>
      ) : null}

      {frameItems.length > 0 ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-foreground">Frames</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {frameItems.map((item) => (
              <ArtifactTile key={`${item.category}-${item.path}`} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {fileItems.length > 0 ? (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-foreground">{t("Relatórios e manifestos")}</h3>
          </div>
          <div>{fileItems.map((item) => <FileAssetRow key={`${item.category}-${item.path}`} item={item} />)}</div>
        </section>
      ) : null}
    </div>
  );
}
