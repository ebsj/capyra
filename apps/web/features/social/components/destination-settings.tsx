"use client";
import { privacyLabels } from "../utils/state";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { Platform, Capabilities } from "../types/social";
export function DestinationSettings({
  platform,
  settings,
  onChange,
  capabilities,
}: {
  platform: Platform;
  settings: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  capabilities: Capabilities | null;
}) {
  const { t } = useI18n();
  const set = (k: string, v: unknown) => onChange({ ...settings, [k]: v });
  const flags =
    platform === "tiktok"
      ? [
          ["allowComment", "Permitir comentários"],
          ["allowDuet", "Permitir duetos"],
          ["allowStitch", "Permitir Stitch"],
          ["isAiGenerated", "Conteúdo gerado por IA"],
          ["previewConfirmed", "Revisei a prévia e confirmo o conteúdo"],
          ["expressConsentGiven", "Autorizo expressamente a publicação no TikTok"],
        ]
      : platform === "youtube"
      ? [
          ["madeForKids", "Conteúdo para crianças"],
          ["containsSyntheticMedia", "Contém mídia sintética"],
        ]
      : [["shareToFeed", "Compartilhar no feed"]];
  return (
    <fieldset className="grid gap-3 rounded-xl border p-4">
      <legend className="px-2 font-medium">{t("Configurações do Destino")}</legend>
      {platform !== "instagram" ? (
        <label>
          {t("Privacidade")}
          <select
            aria-label={t("Privacidade")}
            value={String(settings.privacyLevel ?? "")}
            onChange={(e) => set("privacyLevel", e.target.value)}
            className="mt-1 h-10 w-full rounded-md border bg-background px-3"
          >
            <option value="">{t("Selecionar")}</option>
            {(capabilities?.privacyLevels ?? []).map((v) => (
              <option key={v} value={v}>
                {t(privacyLabels[v] ?? v)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {flags.map(([key, label]) => {
        const interactionName: Record<string, string> = { allowComment: "allow_comment", allowDuet: "allow_duet", allowStitch: "allow_stitch" };
        const disabled = capabilities?.interactionSettings?.[interactionName[key]]?.enabled === false;
        if (platform === "tiktok" && key in interactionName)
          return (
            <label key={key} className="grid gap-1 text-sm">
              {t(label)}
              <select
                aria-label={t(label)}
                value={typeof settings[key] === "boolean" ? String(settings[key]) : ""}
                onChange={(e) => set(key, e.target.value === "" ? undefined : e.target.value === "true")}
                className="h-10 rounded border bg-background px-3"
              >
                <option value="">{t("Selecionar")}</option>
                <option value="false">{t("Não permitir")}</option>
                <option value="true" disabled={disabled}>
                  {t("Permitir")}
                </option>
              </select>
            </label>
          );
        return (
          <label key={key} className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={settings[key] === true} onChange={(e) => set(key, e.target.checked)} />
            {t(label)}
          </label>
        );
      })}
      {platform === "tiktok" ? (
        <label>
          {t("Conteúdo comercial")}
          <select
            className="mt-1 h-10 w-full rounded-md border bg-background px-3"
            value={String(settings.commercialContentType ?? "none")}
            onChange={(e) => set("commercialContentType", e.target.value)}
          >
            <option value="none">{t("Não comercial")}</option>
            <option value="brand_organic">{t("Minha marca")}</option>
            <option value="brand_content">{t("Parceria comercial")}</option>
          </select>
        </label>
      ) : null}
      {platform === "youtube" ? (
        <label>
          {t("Tags separadas por vírgula")}
          <Input
            value={Array.isArray(settings.tags) ? settings.tags.join(", ") : ""}
            onChange={(e) =>
              set(
                "tags",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
          />
        </label>
      ) : (
        <label>
          {t("Instante da capa (ms)")}
          <Input
            type="number"
            min={0}
            value={typeof settings.coverTimestampMs === "number" ? settings.coverTimestampMs : ""}
            onChange={(e) => set("coverTimestampMs", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
      )}
    </fieldset>
  );
}
