import type { Locale } from "@/lib/i18n/config";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

type Messages = Record<string, string>;

const ptBr: Messages = {ready:"Pronto",pending:"Pendente",failed:"Falha",accepted:"Aceito",revoked:"Revogado",active:"Ativa",inactive:"Inativa",available:"Disponível",unavailable:"Indisponível",expired:"Expirado",maxBytes:"Tamanho máximo (bytes)",maxImages:"Máximo de imagens",maxContentLength:"Máximo de caracteres",minVideoSeconds:"Duração mínima (segundos)",maxVideoSeconds:"Duração máxima (segundos)"};

const messages: Record<Locale, Messages> = {
  "pt-br": ptBr,
  en,
  es,
};

export function translate(locale: Locale, source: string, values?: Record<string, string | number>) {
  const template = messages[locale][source] ?? source;

  if (!values) {
    return template;
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
