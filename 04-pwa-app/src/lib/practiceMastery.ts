import { supabase } from "./supabaseClient";

export type PracticeResult = "correct" | "incorrect";

export interface RecordPracticeResultInput {
  lessonId?: string | null;
  patternId?: string | null;
  drillItemId?: string | null;
  result: PracticeResult;
  answerText?: string;
  reactionLatencyMs?: number | null;
  grammarScore?: number | null;
  pronunciationScore?: number | null;
}

export async function recordPracticeResult(input: RecordPracticeResultInput) {
  if (!input.patternId) throw new Error("pattern_id_required");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("not_authenticated");

  const { data: attempt, error: attemptError } = await (supabase as any)
    .from("practice_attempts")
    .insert({
      user_id: userData.user.id,
      lesson_id: input.lessonId ?? null,
      pattern_id: input.patternId,
      drill_item_id: input.drillItemId ?? null,
      result: input.result,
      answer_text: input.answerText ?? null,
      reaction_latency_ms: input.reactionLatencyMs ?? null,
      grammar_score: input.grammarScore ?? null,
      pronunciation_score: input.pronunciationScore ?? null,
    })
    .select("*")
    .single();

  if (attemptError) throw attemptError;

  const { data: mastery, error: masteryError } = await (supabase as any).rpc("record_learning_event", {
    p_entity_type: "pattern",
    p_entity_id: input.patternId,
    p_lesson_id: input.lessonId ?? null,
    p_result: input.result,
    p_attempt_id: attempt.id,
  });

  if (masteryError) {
    // Keep the attempt even if the secondary mastery update fails; callers can retry
    // the mastery operation without losing the learner's raw attempt record.
    throw masteryError;
  }

  return { attempt, mastery };
}
