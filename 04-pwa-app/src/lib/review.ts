import { supabase } from "./supabaseClient";

export type ReviewEntityType = "grammar" | "pattern" | "vocabulary" | "insight";

export interface ReviewQueueItem {
  id: string;
  user_id: string;
  entity_type: ReviewEntityType;
  entity_id: string;
  lesson_id: string | null;
  reason: string;
  due_at: string;
  priority: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getDueReviews(limit = 20): Promise<ReviewQueueItem[]> {
  const { data, error } = await (supabase as any).rpc("get_due_reviews", { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as ReviewQueueItem[];
}

export async function completeReviewItem(reviewId: string): Promise<ReviewQueueItem> {
  const { data, error } = await (supabase as any).rpc("complete_review_item", {
    p_review_id: reviewId,
  });
  if (error) throw error;
  return data as ReviewQueueItem;
}
