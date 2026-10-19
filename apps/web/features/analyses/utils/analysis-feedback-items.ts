import type { AnalysisSkillId } from "@/lib/models";

export function buildRecommendationFeedbackItemKey(skillId: AnalysisSkillId, itemIndex: number) {
  return `recommendation:${skillId}:${itemIndex}`;
}
