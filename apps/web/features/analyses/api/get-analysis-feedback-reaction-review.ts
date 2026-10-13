import { createServerApiRequest } from "@/lib/http.server";
import type { FeedbackReactionReviewResponseContract } from "@/lib/models";

export function getAnalysisFeedbackReactionReviewForServer(
  accessToken: string,
  analysisId: string,
  limit = 50,
): Promise<FeedbackReactionReviewResponseContract> {
  const request = createServerApiRequest(accessToken);
  return request<FeedbackReactionReviewResponseContract>(
    `/analyses/${analysisId}/feedback-reactions/review?limit=${limit}`,
  );
}
