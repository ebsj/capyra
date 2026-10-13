import type { Locale } from "@/lib/i18n/config";

export type AnalysisIntentExampleId = "conversion" | "retention" | "clarity" | "trust" | "improvement";

export type AnalysisIntentExample = {
  id: AnalysisIntentExampleId;
  label: string;
  text: string;
};

const EXAMPLES: Record<Locale, AnalysisIntentExample[]> = {
  "pt-br": [
    {
      id: "conversion",
      label: "Conversão",
      text: "Quero saber se este vídeo convence a pessoa certa a dar o próximo passo sem parecer forçado.",
    },
    {
      id: "retention",
      label: "Retenção",
      text: "Avalie se a abertura e o ritmo mantêm atenção até o CTA final.",
    },
    {
      id: "clarity",
      label: "Clareza",
      text: "Verifique se a promessa, o problema e a solução ficam claros para alguém vendo pela primeira vez.",
    },
    {
      id: "trust",
      label: "Confiança",
      text: "Analise se o vídeo transmite autoridade e segurança suficientes para um público cético.",
    },
    {
      id: "improvement",
      label: "Melhoria",
      text: "Aponte o que eu deveria ajustar no próximo corte para deixar a mensagem mais forte.",
    },
  ],
  en: [
    {
      id: "conversion",
      label: "Conversion",
      text: "I want to know whether this video persuades the right viewer to take the next step without feeling forced.",
    },
    {
      id: "retention",
      label: "Retention",
      text: "Evaluate whether the opening and pacing keep attention until the final CTA.",
    },
    {
      id: "clarity",
      label: "Clarity",
      text: "Check whether the promise, problem, and solution are clear to someone watching for the first time.",
    },
    {
      id: "trust",
      label: "Trust",
      text: "Analyze whether the video creates enough authority and confidence for a skeptical audience.",
    },
    {
      id: "improvement",
      label: "Improvement",
      text: "Point out what I should adjust in the next cut to make the message stronger.",
    },
  ],
  es: [
    {
      id: "conversion",
      label: "Conversion",
      text: "Quiero saber si este video convence al publico correcto de dar el siguiente paso sin sentirse forzado.",
    },
    {
      id: "retention",
      label: "Retencion",
      text: "Evalua si la apertura y el ritmo mantienen la atencion hasta el CTA final.",
    },
    {
      id: "clarity",
      label: "Claridad",
      text: "Verifica si la promesa, el problema y la solucion quedan claros para alguien que lo ve por primera vez.",
    },
    {
      id: "trust",
      label: "Confianza",
      text: "Analiza si el video transmite suficiente autoridad y seguridad para un publico esceptico.",
    },
    {
      id: "improvement",
      label: "Mejora",
      text: "Senala que deberia ajustar en el proximo corte para fortalecer el mensaje.",
    },
  ],
};

export function analysisIntentExamples(locale: Locale) {
  return EXAMPLES[locale];
}
