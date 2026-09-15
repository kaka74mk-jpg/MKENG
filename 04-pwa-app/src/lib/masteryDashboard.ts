import { supabase } from "./supabaseClient";

export type MasteryBand = "Strong" | "Solid" | "Developing" | "Needs work";

export interface MasteryDashboardRow {
  patternId: string;
  lessonId: string | null;
  pattern: string;
  mastery: number;
  exposures: number;
  correct: number;
  incorrect: number;
  nextReviewAt: string | null;
  lastPracticedAt: string | null;
  due: boolean;
}

export interface MasteryDashboardData {
  rows: MasteryDashboardRow[];
  attempts: number;
  correctAttempts: number;
  dueReviews: number;
  averageMastery: number;
  strongCount: number;
  solidCount: number;
  developingCount: number;
  needsWorkCount: number;
  practiceMinutes7d: number;
}

export function masteryBand(score: number): MasteryBand {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Solid";
  if (score >= 30) return "Developing";
  return "Needs work";
}

export async function getMasteryDashboard(): Promise<MasteryDashboardData> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [masteryResult, patternsResult, attemptsResult, dueResult] = await Promise.all([
    (supabase as any).from("learner_mastery").select("*").order("mastery_score", { ascending: true }),
    (supabase as any).from("patterns").select("id, lesson_id, grammar_structure_en, order_index").order("order_index"),
    (supabase as any).from("practice_attempts").select("result, reaction_latency_ms, created_at").gte("created_at", since),
    (supabase as any).rpc("get_due_reviews", { p_limit: 100 }),
  ]);

  if (masteryResult.error) throw masteryResult.error;
  if (patternsResult.error) throw patternsResult.error;
  if (attemptsResult.error) throw attemptsResult.error;
  if (dueResult.error) throw dueResult.error;

  const patternMap = new Map<string, any>((patternsResult.data ?? []).map((p: any) => [p.id, p]));
  const now = Date.now();
  const rows: MasteryDashboardRow[] = (masteryResult.data ?? [])
    .filter((m: any) => m.entity_type === "pattern")
    .map((m: any) => {
      const pattern = patternMap.get(m.entity_id);
      return {
        patternId: m.entity_id,
        lessonId: pattern?.lesson_id ?? m.last_session_id ?? null,
        pattern: pattern?.grammar_structure_en ?? "Pattern",
        mastery: Number(m.mastery_score ?? 0),
        exposures: Number(m.exposure_count ?? 0),
        correct: Number(m.successful_recall_count ?? 0),
        incorrect: Number(m.failed_recall_count ?? 0),
        nextReviewAt: m.next_review_at ?? null,
        lastPracticedAt: m.last_practiced_at ?? null,
        due: Boolean(m.next_review_at && new Date(m.next_review_at).getTime() <= now),
      };
    })
    .sort((a: MasteryDashboardRow, b: MasteryDashboardRow) => a.mastery - b.mastery);

  const attempts = attemptsResult.data ?? [];
  const attemptsCount = attempts.length;
  const correctAttempts = attempts.filter((a: any) => a.result === "correct").length;
  const averageMastery = rows.length ? rows.reduce((sum, row) => sum + row.mastery, 0) / rows.length : 0;
  const bands = rows.reduce(
    (acc, row) => {
      const band = masteryBand(row.mastery);
      if (band === "Strong") acc.strong++;
      else if (band === "Solid") acc.solid++;
      else if (band === "Developing") acc.developing++;
      else acc.needsWork++;
      return acc;
    },
    { strong: 0, solid: 0, developing: 0, needsWork: 0 },
  );

  const latency = attempts
    .map((a: any) => Number(a.reaction_latency_ms))
    .filter((n: number) => Number.isFinite(n) && n > 0);
  const practiceMinutes7d = latency.length
    ? Math.max(1, Math.round((latency.reduce((a: number, b: number) => a + b, 0) / 60000) * 10) / 10)
    : Math.max(0, Math.round(attemptsCount * 0.35 * 10) / 10);

  return {
    rows,
    attempts: attemptsCount,
    correctAttempts,
    dueReviews: (dueResult.data ?? []).length,
    averageMastery: Math.round(averageMastery * 10) / 10,
    strongCount: bands.strong,
    solidCount: bands.solid,
    developingCount: bands.developing,
    needsWorkCount: bands.needsWork,
    practiceMinutes7d,
  };
}
