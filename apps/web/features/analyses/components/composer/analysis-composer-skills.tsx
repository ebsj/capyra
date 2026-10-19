"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisSkillCatalogItem, SelectedAnalysisSkillId } from "@/lib/models";

import { SkillButton } from "./analysis-composer-options";

type Props = {
  catalog: AnalysisSkillCatalogItem[];
  catalogError: string | null;
  isCatalogLoading: boolean;
  isPending: boolean;
  selectedSkills: SelectedAnalysisSkillId[];
  setError: (value: string | null) => void;
  setSelectedSkills: (update: (current: SelectedAnalysisSkillId[]) => SelectedAnalysisSkillId[]) => void;
};

function toggleSkill(selectedSkills: SelectedAnalysisSkillId[], skillId: SelectedAnalysisSkillId) {
  return selectedSkills.includes(skillId)
    ? selectedSkills.filter((current) => current !== skillId)
    : [...selectedSkills, skillId];
}

export function AnalysisComposerSkills({
  catalog,
  catalogError,
  isCatalogLoading,
  isPending,
  selectedSkills,
  setError,
  setSelectedSkills,
}: Props) {
  const { t } = useI18n();

  return (
    <section aria-label={t("Skills da análise")} className="grid gap-3">
      {isCatalogLoading ? <p className="text-sm text-muted-foreground">{t("Carregando catálogo oficial...")}</p> : null}
      {catalogError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("Catálogo indisponível")}</AlertTitle>
          <AlertDescription>{catalogError}</AlertDescription>
        </Alert>
      ) : null}
      {!isCatalogLoading && !catalogError ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((item) => (
            <SkillButton
              key={item.id}
              disabled={isPending}
              item={item}
              selected={selectedSkills.includes(item.id)}
              onToggle={() => {
                setError(null);
                setSelectedSkills((current) => toggleSkill(current, item.id));
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
