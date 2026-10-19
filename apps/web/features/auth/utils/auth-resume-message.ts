type AuthResumeMessage = {
  title: string;
  description: string;
};

type Translator = (source: string) => string;

export function buildLoginResumeMessage(
  reason: string | null | undefined,
  t: Translator,
): AuthResumeMessage | null {
  if (reason === "session-expired") {
    return {
      title: t("Sessão expirada"),
      description: t("Receba um novo link para retomar exatamente o ponto onde você parou."),
    };
  }

  return null;
}
