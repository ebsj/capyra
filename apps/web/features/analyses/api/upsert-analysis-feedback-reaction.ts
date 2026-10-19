import { createBrowserApiRequest } from "@/lib/http";
import type {
  FeedbackReactionUpsertRequestContract,
  MyFeedbackReactionContract,
} from "@/lib/models";

export function upsertAnalysisFeedbackReaction(
  accessToken: string,
  analysisId: string,
  feedbackItemKey: string,
  body: FeedbackReactionUpsertRequestContract,
): Promise<MyFeedbackReactionContract> {
  const request = createBrowserApiRequest(accessToken);
  return request<MyFeedbackReactionContract>(`/analyses/${analysisId}/feedback-reactions/${feedbackItemKey}`, {
    method: "PUT",
    body,
  });
}
