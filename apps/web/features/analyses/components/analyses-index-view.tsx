"use client";

import Image from "next/image";
import { useDeferredValue, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SystemState } from "@/components/system-state";
import type { BrandContract } from "@/lib/models";
import type { AnalysisListItemContract } from "@/lib/models";
import { useI18n } from "@/components/i18n/i18n-provider";
import { AnalysisCard } from "./analysis-card";

import {
  formatAnalysisSource,
} from "../utils/analysis-utils";

type Props = {
  items: AnalysisListItemContract[];
  brands: BrandContract[];
};

type StatusFilter = "all" | "completed" | "pending" | "failed";
const PAGE_SIZE = 9;
const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: "Todos", value: "all" },
  { label: "Concluídas", value: "completed" },
  { label: "Pendentes", value: "pending" },
  { label: "Com observações", value: "failed" },
];

export function AnalysesIndexView({ items, brands }: Props) {
  const { href, t } = useI18n();
  const [brandId,setBrandId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (brandId === "legacy" ? Boolean(item.brandId) : brandId && item.brandId !== brandId) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [
      item.summary,
      item.sourceLabel,
      item.sourceUrl ?? "",
      item.platform ?? "",
      formatAnalysisSource(item.sourceLabel, item.sourceUrl),
      item.selectedSkillIds.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstItemIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = filteredItems.slice(firstItemIndex, firstItemIndex + PAGE_SIZE);
  const selectedStatusLabel = t(STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ?? "Todos");

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (items.length === 0) {
    return (
      <SystemState
        tone="empty"
        eyebrow={t("Histórico")}
        title={t("Histórico privado vazio")}
        description={t("Crie a primeira análise pela Home para ver os cards com status, procedência, nota e skills.")}
        primaryAction={{ label: t("Ir para Home"), href: href("/dashboard") }}
      >
        <div aria-hidden="true" className="relative mx-auto size-28">
          <Image
            alt=""
            className="object-contain drop-shadow-[0_14px_24px_rgb(15_23_42/0.12)]"
            fill
            sizes="112px"
            src="/brand/capyra-backpack.png"
          />
        </div>
      </SystemState>
    );
  }

  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium">{t("Marca")}<select aria-label={t("Marca")} className="h-10 rounded-xl border bg-card px-3" value={brandId} onChange={e=>{setBrandId(e.target.value);setPage(1);}}><option value="">{t("Todas as Marcas")}</option><option value="legacy">{t("Sem Marca (anteriores)")}</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brandSoft">{items.length} {t("análises")}</Badge>
        <Badge variant="success">{filteredItems.length} {t("resultados")}</Badge>
        <Badge variant="outline">
          {t("Página {currentPage} de {totalPages}", { currentPage, totalPages })}
        </Badge>
      </div>

      <section className="grid gap-3 rounded-[1rem] border border-border bg-surface-strong/92 p-3 shadow-[inset_0_1px_0_hsl(var(--card)/0.72),0_8px_18px_hsl(var(--foreground)/0.045)] sm:p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
        <div className="grid gap-2">
          <label htmlFor="analyses-search" className="text-sm font-medium text-foreground">
            {t("Buscar no histórico")}
          </label>
          <Input
            id="analyses-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={t("Resumo, origem, URL ou skill")}
            className="h-10 rounded-xl border-border bg-card shadow-sm"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="analyses-status" className="text-sm font-medium text-foreground">
            {t("Status")}
          </label>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger id="analyses-status" className="h-10 rounded-xl border-border bg-card text-foreground shadow-sm">
              <SelectValue placeholder={t("Todos os status")}>{selectedStatusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground">
              <SelectGroup>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {t(filter.label)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </section>

      {filteredItems.length === 0 ? (
        <SystemState
          tone="no-results"
          eyebrow={t("Histórico")}
          title={t("Nenhum resultado para este filtro")}
          description={t("Ajuste a busca ou o status para reencontrar a análise desejada.")}
          primaryAction={{
            label: t("Limpar filtros"),
            onClick: () => {
              setQuery("");
              setStatusFilter("all");
            },
          }}
          secondaryAction={{ label: t("Voltar para Home"), href: href("/dashboard"), variant: "outline" }}
        />
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {paginatedItems.map((item) => (
              <AnalysisCard key={item.id} item={item} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border bg-card/80 p-3 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                {firstItemIndex + 1}-{Math.min(firstItemIndex + PAGE_SIZE, filteredItems.length)} de{" "}
                {filteredItems.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {t("Anterior")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  {t("Próxima")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
