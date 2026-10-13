"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { listBrands } from "../api/brands-api";
import type { Brand } from "../types/brand";
export function BrandSelect({
  accessToken,
  value,
  onChange,
  includeArchived = false,
  onSelected,
  disabled = false,
}: {
  accessToken: string;
  value: string;
  onChange: (id: string) => void;
  includeArchived?: boolean;
  onSelected?: (brand: Brand | null) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    listBrands(accessToken)
      .then((r) => {
        if (live) setBrands(r.items);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [accessToken]);
  useEffect(() => {
    onSelected?.(brands.find((b) => b.id === value) ?? null);
  }, [brands, value, onSelected]);
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">
        {t("Marca")}
        <select
          aria-label={t("Marca")}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3"
        >
          <option value="">{t("Selecione uma Marca")}</option>
          {brands
            .filter((b) => includeArchived || b.status === "active")
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.timeZone}
                {b.status !== "active" ? ` (${t("Arquivada")})` : ""}
              </option>
            ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
