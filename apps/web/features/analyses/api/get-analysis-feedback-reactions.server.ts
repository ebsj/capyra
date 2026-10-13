import { createServerApiRequest } from "@/lib/http.server";
import type { MyFeedbackReactionListResponseContract } from "@/lib/models";

export function getAnalysisFeedbackReactionsForServer(
  accessToken: string,
  analysisId: string,
): Promise<MyFeedbackReactionListResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<MyFeedbackReactionListResponseContract>(`/analyses/${analysisId}/feedback-reactions/mine`);
}
