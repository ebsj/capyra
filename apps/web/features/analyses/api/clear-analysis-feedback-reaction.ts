import { createBrowserApiRequest } from "@/lib/http";

export function clearAnalysisFeedbackReaction(
  accessToken: string,
  analysisId: string,
  feedbackItemKey: string,
): Promise<void> {
  const request = createBrowserApiRequest(accessToken);
  return request<void>(`/analyses/${analysisId}/feedback-reactions/${feedbackItemKey}`, {
    method: "DELETE",
  });
}
