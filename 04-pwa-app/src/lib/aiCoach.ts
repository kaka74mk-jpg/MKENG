import { supabase } from "./supabaseClient";

export type CoachMessage = { role: "user" | "assistant"; content: string };

export interface CoachContext {
  dueReviews: number;
  weakPatterns: Array<{ patternId: string; lessonId: string | null; pattern: string; mastery: number }>;
  lessonId?: string | null;
}

export async function getCoachContext(lessonId?: string | null): Promise<CoachContext> {
  const { data: due, error: dueError } = await (supabase as any).rpc("get_due_reviews", { p_limit: 20 });
  if (dueError) throw dueError;

  let masteryQuery = supabase
    .from("learner_mastery")
    .select("entity_id, mastery_score, last_practiced_at, next_review_at")
    .eq("entity_type", "pattern")
    .order("mastery_score", { ascending: true })
    .limit(8);
  if (lessonId) masteryQuery = masteryQuery.eq("last_session_id", lessonId) as typeof masteryQuery;

  const { data: mastery, error: masteryError } = await masteryQuery;
  if (masteryError) throw masteryError;

  const ids = (mastery ?? []).map((m: any) => m.entity_id).filter(Boolean);
  let patterns: any[] = [];
  if (ids.length) {
    const { data, error } = await supabase.from("patterns").select("id, lesson_id, grammar_structure_en").in("id", ids);
    if (error) throw error;
    patterns = data ?? [];
  }

  const patternMap = new Map(patterns.map((p) => [p.id, p]));
  return {
    dueReviews: (due ?? []).length,
    lessonId: lessonId ?? null,
    weakPatterns: (mastery ?? []).map((m: any) => {
      const p = patternMap.get(m.entity_id);
      return { patternId: m.entity_id, lessonId: p?.lesson_id ?? null, pattern: p?.grammar_structure_en ?? "Unknown pattern", mastery: Number(m.mastery_score ?? 0) };
    }),
  };
}

export async function askCoach(messages: CoachMessage[], context: CoachContext) {
  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: { messages, context },
  });
  if (error) throw error;
  if (!data?.message) throw new Error("coach_empty_response");
  return data.message as string;
}
