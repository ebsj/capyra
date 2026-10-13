"use client";

import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisSkillCatalogItem, SourceAssetItem } from "@/lib/models";
import { AnalysisComposer } from "./composer/analysis-composer";

type Props = {
  accessToken: string;
  initialAssets: SourceAssetItem[];
  initialCatalog: AnalysisSkillCatalogItem[];
};

export function NewAnalysisView({ accessToken, initialAssets, initialCatalog }: Props) {
  const router = useRouter();
  const { href } = useI18n();

  return (
    <div className="grid min-w-0 gap-6">
      <AnalysisComposer
        accessToken={accessToken}
        initialAssets={initialAssets}
        initialCatalog={initialCatalog}
        onCreated={(analysis) => {
          router.refresh();
          router.push(href(`/analyses/${analysis.id}`));
        }}
      />
    </div>
  );
}
