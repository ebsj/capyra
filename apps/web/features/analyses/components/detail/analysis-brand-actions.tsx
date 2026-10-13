"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandSelect } from "@/features/brands";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import type { AnalysisDetailResponseContract } from "@/lib/models";
import { assignAnalysisBrand } from "../../api/assign-analysis-brand";
export function AnalysisBrandActions({ analysis, accessToken }: { analysis: AnalysisDetailResponseContract; accessToken: string }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [brandId, setBrandId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (analysis.brandId)
    return analysis.status === "completed" ? (
      <Button asChild variant="outline">
        <Link href={href(`/social-publications?brandId=${analysis.brandId}&analysisId=${analysis.id}`)}>{t("Criar publicação a partir da análise")}</Link>
      </Button>
    ) : null;
  return (
    <div className="grid gap-3 rounded-xl border p-4">
      <p>{t("Esta análise anterior ainda não possui Marca. Atribua uma Marca antes de vinculá-la a uma publicação.")}</p>
      <BrandSelect accessToken={accessToken} value={brandId} onChange={setBrandId} />
      <Button
        disabled={!brandId || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await assignAnalysisBrand(accessToken, analysis.id, brandId);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : t("Não foi possível concluir."));
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Atribuir Marca")}
      </Button>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
