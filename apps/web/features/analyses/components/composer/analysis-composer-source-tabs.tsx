"use client";

import type { DragEvent, RefObject } from "react";
import { Archive, FileUp, Link2, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { SourceAssetItem } from "@/lib/models";
import { cn } from "@/lib/utils";
import type { ComposerMode } from "../../types/analysis-composer.types";
import { formatFileSize } from "../../utils/format-file-size";

import { AssetOption } from "./analysis-composer-options";

type Props = {
  assets: SourceAssetItem[];
  assetsError: string | null;
  file: File | null;
  fileInputId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isAssetsLoading: boolean;
  isDraggingFile: boolean;
  isPending: boolean;
  mode: ComposerMode;
  selectedSourceAssetId: string | null;
  setError: (value: string | null) => void;
  setFile: (value: File | null) => void;
  setIsDraggingFile: (value: boolean) => void;
  setMode: (value: ComposerMode) => void;
  setSelectedSourceAssetId: (value: string | null) => void;
  setUrl: (value: string) => void;
  url: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onSelectFile: (file: File | null) => void;
};

export function AnalysisComposerSourceTabs(props: Props) {
  const { t } = useI18n();

  return (
    <section aria-label={t("Origem do vídeo")} className="grid min-w-0 gap-3">
      <Tabs
        value={props.mode}
        onValueChange={(value) => {
          props.setError(null);
          props.setMode(value as ComposerMode);
        }}
        className="grid min-w-0 gap-4"
      >
        <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 rounded-[1.35rem] bg-muted/80 p-1">
          <TabsTrigger value="url" className="min-w-0 gap-2 rounded-[1rem] py-2">
            <Link2 aria-hidden="true" className="size-4" />
            <span className="truncate">URL</span>
          </TabsTrigger>
          <TabsTrigger value="file" className="min-w-0 gap-2 rounded-[1rem] py-2">
            <FileUp aria-hidden="true" className="size-4" />
            <span className="truncate">{t("Arquivo")}</span>
          </TabsTrigger>
          <TabsTrigger value="asset" className="min-w-0 gap-2 rounded-[1rem] py-2">
            <Archive aria-hidden="true" className="size-4" />
            <span className="truncate">{t("Salvos")}</span>
          </TabsTrigger>
        </TabsList>

        <UrlTab {...props} />
        <FileTab {...props} />
        <AssetTab {...props} />
      </Tabs>
    </section>
  );
}

function UrlTab({ isPending, setError, setUrl, url }: Props) {
  const { t } = useI18n();

  return (
    <TabsContent value="url" className="mt-0">
      <div className="grid min-w-0 gap-3 rounded-[1.55rem] border border-border bg-background/76 p-4">
        <Label htmlFor="analysis-url" className="text-sm font-semibold">{t("URL pública do vídeo")}</Label>
        <Input
          id="analysis-url"
          name="analysis-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(event) => {
            setError(null);
            setUrl(event.target.value);
          }}
          placeholder="https://www.youtube.com/shorts/..."
          disabled={isPending}
          autoComplete="off"
          className="h-12 rounded-2xl bg-card text-base"
        />
        <p className="text-sm leading-6 text-muted-foreground">
          {t("A leitura por URL depende da plataforma. Se ela bloquear o acesso, envie o arquivo ou use um vídeo salvo.")}
        </p>
      </div>
    </TabsContent>
  );
}

function FileTab(props: Props) {
  return (
    <TabsContent value="file" className="mt-0">
      <div
        onDrop={props.onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          props.setIsDraggingFile(true);
        }}
        onDragLeave={() => props.setIsDraggingFile(false)}
        className={cn(
          "grid min-w-0 gap-4 rounded-[1.55rem] border border-dashed bg-background/76 p-5 transition-colors",
          props.isDraggingFile ? "border-primary bg-primary/10" : "border-border",
        )}
      >
        <FilePickerHeader {...props} />
        <Input
          id={props.fileInputId}
          ref={props.fileInputRef}
          name="analysis-file"
          type="file"
          accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
          disabled={props.isPending}
          onChange={(event) => props.onSelectFile(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
        {props.file ? <SelectedFile file={props.file} isPending={props.isPending} setFile={props.setFile} /> : null}
      </div>
    </TabsContent>
  );
}

function FilePickerHeader({ fileInputId, fileInputRef, isPending }: Props) {
  const { t } = useI18n();

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileUp aria-hidden="true" className="size-5" />
        </div>
        <div className="grid min-w-0 gap-1">
          <Label htmlFor={fileInputId} className="text-sm font-semibold">
            {t("Arraste o vídeo ou selecione um arquivo")}
          </Label>
          <p className="text-sm leading-6 text-muted-foreground">{t("MP4, MOV ou WEBM com até 200 MB.")}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
        className="shrink-0 rounded-2xl"
      >
        {t("Escolher arquivo")}
      </Button>
    </div>
  );
}

function SelectedFile({
  file,
  isPending,
  setFile,
}: {
  file: File;
  isPending: boolean;
  setFile: (value: File | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border bg-card/82 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => setFile(null)}
        className="rounded-2xl"
      >
        <X aria-hidden="true" className="size-4" />
        {t("Remover")}
      </Button>
    </div>
  );
}

function AssetTab(props: Props) {
  const { t } = useI18n();

  return (
    <TabsContent value="asset" className="mt-0">
      <div className="grid min-w-0 gap-4 rounded-[1.55rem] border border-border bg-background/76 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <Label className="text-sm font-semibold">{t("Arquivos salvos")}</Label>
            <p className="text-sm leading-6 text-muted-foreground">{t("Reutilize vídeos enviados anteriormente.")}</p>
          </div>
        </div>

        {props.isAssetsLoading ? <p className="text-sm text-muted-foreground">{t("Carregando arquivos salvos...")}</p> : null}
        {props.assetsError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("Arquivos indisponíveis")}</AlertTitle>
            <AlertDescription>{props.assetsError}</AlertDescription>
          </Alert>
        ) : null}
        {!props.isAssetsLoading && !props.assetsError && props.assets.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-border bg-card/70 p-4 text-sm leading-6 text-muted-foreground">
            {t("Nenhum arquivo salvo ainda. Use Arquivo para enviar o primeiro vídeo.")}
          </div>
        ) : null}
        {!props.isAssetsLoading && !props.assetsError && props.assets.length > 0 ? <AssetGrid {...props} /> : null}
      </div>
    </TabsContent>
  );
}

function AssetGrid({ assets, isPending, selectedSourceAssetId, setError, setSelectedSourceAssetId }: Props) {
  return (
    <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
      {assets.map((asset) => (
        <AssetOption
          key={asset.id}
          asset={asset}
          disabled={isPending}
          selected={selectedSourceAssetId === asset.id}
          onSelect={() => {
            setError(null);
            setSelectedSourceAssetId(asset.id);
          }}
        />
      ))}
    </div>
  );
}
