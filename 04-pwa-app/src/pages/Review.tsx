import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getDueReviews, type ReviewQueueItem } from "../lib/review";
import { recordPracticeResult, type PracticeResult } from "../lib/practiceMastery";
import type { DrillItem, Pattern } from "../types/database";

type ReviewCard = ReviewQueueItem & { pattern: Pattern; drill: DrillItem };

export default function Review() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mastery, setMastery] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const due = await getDueReviews(50);
      setQueue(due);

      const patternIds = due.filter((item) => item.entity_type === "pattern").map((item) => item.entity_id);
      if (!patternIds.length) {
        setCards([]);
        return;
      }

      const [{ data: patterns, error: patternError }, { data: drills, error: drillError }] = await Promise.all([
        supabase.from("patterns").select("*").in("id", patternIds),
        supabase.from("drill_items").select("*").in("pattern_id", patternIds).order("order_index"),
      ]);

      if (patternError || drillError) throw patternError ?? drillError;

      const patternMap = new Map((patterns ?? []).map((p) => [p.id, p as Pattern]));
      const firstDrillMap = new Map<string, DrillItem>();
      for (const drill of (drills ?? []) as DrillItem[]) {
        if (!firstDrillMap.has(drill.pattern_id)) firstDrillMap.set(drill.pattern_id, drill);
      }

      const hydrated = due
        .filter((item) => item.entity_type === "pattern")
        .map((item) => {
          const pattern = patternMap.get(item.entity_id);
          const drill = firstDrillMap.get(item.entity_id);
          return pattern && drill ? { ...item, pattern, drill } : null;
        })
        .filter(Boolean) as ReviewCard[];

      setCards(hydrated);
      setIndex(0);
    } catch (err) {
      console.error(err);
      setError("Review queue could not be loaded. Check your Supabase connection and sign-in.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = cards[index];
  const remaining = Math.max(0, cards.length - index);
  const position = useMemo(() => (current ? `${index + 1} / ${cards.length}` : ""), [current, index, cards.length]);

  async function answer(result: PracticeResult) {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await recordPracticeResult({
        lessonId: current.lesson_id,
        patternId: current.pattern.id,
        drillItemId: current.drill.id,
        result,
      });
      setMastery(Number(response.mastery.mastery_score ?? 0));
      setFeedback(result === "correct" ? "Correct. This pattern has been rescheduled." : "Saved. This pattern will return sooner.");
      setShowAnswer(false);
      setIndex((value) => value + 1);
      setQueue((items) => items.filter((item) => item.id !== current.id));
    } catch (err) {
      console.error(err);
      setError("Your result could not be saved. Please sign in and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <State title="Review" message={error} action="Try again" onAction={load} />;

  return (
    <div className="px-5 pt-7">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-fa text-xs text-amber">REVIEW · PHASE 7B</p>
          <h1 className="mt-1 font-display text-3xl text-parchment">Due Practice</h1>
        </div>
        <div className="text-right text-xs text-parchment/50">
          <div>{queue.length} due</div>
          {position && <div className="mt-1">{position}</div>}
        </div>
      </header>

      {cards.length === 0 || !current ? (
        <section className="rounded-card bg-ink-soft p-7 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-2xl text-teal">✓</div>
          <h2 className="mt-5 font-display text-2xl text-parchment">Nothing due right now</h2>
          <p className="mt-3 text-sm leading-6 text-parchment/50">
            Your review queue is clear. Keep practicing from a lesson and the next review will be scheduled automatically.
          </p>
          <button onClick={() => navigate("/learn")} className="mt-6 rounded-2xl bg-amber px-5 py-3 text-sm font-semibold text-ink">
            Back to Learn
          </button>
        </section>
      ) : (
        <>
          <section className="rounded-card bg-ink-soft p-5 shadow-lg">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="rounded-full bg-amber/15 px-3 py-1 text-xs text-amber">Due now</span>
              {mastery !== null && <span className="text-xs text-teal">Mastery {Math.round(mastery)}%</span>}
            </div>

            <p className="mb-3 text-sm text-parchment/50">Recall the English sentence:</p>
            <p className="font-fa text-xl leading-9 text-parchment" dir="rtl">{current.drill.sentence_fa}</p>

            <div className="mt-6 border-t border-parchment/10 pt-5">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-parchment/35">Pattern</p>
              <p className="font-display text-lg text-amber" dir="ltr">{current.pattern.grammar_structure_en}</p>
            </div>

            {showAnswer && (
              <div className="mt-5 rounded-2xl bg-ink px-4 py-4">
                <p className="text-xs text-parchment/40">Answer</p>
                <p className="mt-1 font-display text-lg text-parchment" dir="ltr">{current.drill.sentence_en}</p>
              </div>
            )}
          </section>

          {feedback && <p className="mt-4 text-center text-sm text-teal">{feedback}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button disabled={busy} onClick={() => answer("incorrect")} className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-4 text-sm text-parchment disabled:opacity-50">
              {busy ? "Saving…" : "✕ Incorrect"}
            </button>
            <button disabled={busy} onClick={() => answer("correct")} className="rounded-2xl bg-amber px-4 py-4 text-sm font-semibold text-ink disabled:opacity-50">
              ✓ Correct
            </button>
          </div>

          {!showAnswer && (
            <button onClick={() => setShowAnswer(true)} className="mt-3 w-full rounded-2xl border border-parchment/10 px-4 py-3 text-sm text-parchment/60">
              Reveal answer
            </button>
          )}

          <p className="mt-4 text-center text-xs text-parchment/30">{remaining} review item{remaining === 1 ? "" : "s"} remaining</p>
        </>
      )}
    </div>
  );
}

function State({ title, message, action, onAction }: { title: string; message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="px-5 pt-10 text-center">
      <h1 className="font-display text-2xl text-parchment">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-parchment/50">{message}</p>
      {action && onAction && <button onClick={onAction} className="mt-5 rounded-2xl bg-amber px-5 py-3 text-sm font-semibold text-ink">{action}</button>}
    </div>
  );
}
