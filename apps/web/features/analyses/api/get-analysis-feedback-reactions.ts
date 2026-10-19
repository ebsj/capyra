import { createBrowserApiRequest } from "@/lib/http";
import type { MyFeedbackReactionListResponseContract } from "@/lib/models";

export function getAnalysisFeedbackReactions(
  accessToken: string,
  analysisId: string,
): Promise<MyFeedbackReactionListResponseContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<MyFeedbackReactionListResponseContract>(`/analyses/${analysisId}/feedback-reactions/mine`);
}
