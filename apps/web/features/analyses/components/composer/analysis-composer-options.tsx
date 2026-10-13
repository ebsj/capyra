"use client";

import { Check, CircleAlert } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/components/i18n/i18n-provider";
import { getSkillDisplayName, getSkillDisplaySummary } from "@/lib/analysis-skill-display";
import { toDateLocale } from "@/lib/i18n/locale-format";
import type { AnalysisSkillCatalogItem, SourceAssetItem } from "@/lib/models";
import { cn } from "@/lib/utils";
import { formatFileSize } from "../../utils/format-file-size";

export function SkillButton({
  disabled,
  item,
  selected,
  onToggle,
}: {
  disabled: boolean;
  item: AnalysisSkillCatalogItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const displayName = getSkillDisplayName(item, t);
  const displaySummary = getSkillDisplaySummary(item, t);

  return (
    <div
      className={cn(
        "relative rounded-[1.2rem] border transition duration-200",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-background/72 hover:border-primary/35 hover:bg-accent/45",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={onToggle}
        className="grid min-h-20 w-full gap-2 p-3 pr-20 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">{displaySummary}</p>
        </div>
      </button>

      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("Ver detalhes de {displayName}", { displayName })}
              className="flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CircleAlert aria-hidden="true" className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent align="end" className="max-w-80 space-y-3 p-4 text-left" side="top">
            <SkillTooltipContent displayName={displayName} displaySummary={displaySummary} item={item} />
          </TooltipContent>
        </Tooltip>
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          {selected ? <Check aria-hidden="true" className="size-3.5" /> : null}
        </span>
      </div>
    </div>
  );
}

function SkillTooltipContent({
  displayName,
  displaySummary,
  item,
}: {
  displayName: string;
  displaySummary: string;
  item: AnalysisSkillCatalogItem;
}) {
  const { t } = useI18n();

  return (
    <>
      <div className="space-y-1">
        <p className="font-semibold text-popover-foreground">{displayName}</p>
        <p className="text-xs leading-5 text-popover-foreground/80">{item.description}</p>
      </div>
      <TooltipSection title={t("Cobertura")} items={[displaySummary]} />
      {item.criteria.length > 0 ? <TooltipSection title={t("Critérios")} items={item.criteria} list /> : null}
      {item.safeLanguageNotes.length > 0 ? (
        <TooltipSection title={t("Limites")} items={item.safeLanguageNotes} list />
      ) : null}
    </>
  );
}

function TooltipSection({ title, items, list = false }: { title: string; items: string[]; list?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-popover-foreground/60">
        {title}
      </p>
      {list ? (
        <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-popover-foreground/80">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-popover-foreground/80">{items[0]}</p>
      )}
    </div>
  );
}

export function AssetOption({
  asset,
  disabled,
  selected,
  onSelect,
}: {
  asset: SourceAssetItem;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const { locale, t } = useI18n();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "grid gap-3 rounded-[1.25rem] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-background/75 hover:border-primary/35 hover:bg-accent/35",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{asset.sourceLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatFileSize(asset.contentLength)} · {asset.analysisCount} {asset.analysisCount === 1 ? t("análise") : t("análises")}
          </p>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {asset.lastAnalyzedAt
          ? t("Última análise {date}", { date: new Date(asset.lastAnalyzedAt).toLocaleDateString(toDateLocale(locale)) })
          : t("Criado em {date}", { date: new Date(asset.createdAt).toLocaleDateString(toDateLocale(locale)) })}
      </p>
    </button>
  );
}
