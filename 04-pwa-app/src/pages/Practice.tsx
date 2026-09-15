import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { recordPracticeResult, type PracticeResult } from "../lib/practiceMastery";
import { getDueReviews } from "../lib/review";
import type { DrillItem, Pattern } from "../types/database";

type DrillRow = DrillItem & { pattern: Pattern };

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lessonId = searchParams.get("lessonId");
  const [items, setItems] = useState<DrillRow[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [mastery, setMastery] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = items[index];
  const progress = useMemo(() => (items.length ? `${index + 1} / ${items.length}` : ""), [index, items.length]);

  useEffect(() => {
    let active = true;
    async function load() {
      setError(null);
      const [drillResult, dueResult] = await Promise.all([
        lessonId
          ? supabase.from("drill_items").select("*, patterns!inner(*)").eq("patterns.lesson_id", lessonId).order("order_index")
          : supabase.from("drill_items").select("*, patterns!inner(*)").order("order_index").limit(30),
        getDueReviews(100).catch(() => []),
      ]);

      if (!active) return;
      if (drillResult.error) {
        setError("تمرین‌ها بارگذاری نشدند. ابتدا محتوای Drill این درس را بررسی کن.");
        return;
      }

      const rows = ((drillResult.data ?? []) as any[]).map((row) => ({
        ...row,
        pattern: row.patterns,
      })) as DrillRow[];
      setItems(rows);
      setDueCount(dueResult.length);
    }
    load();
    return () => {
      active = false;
    };
  }, [lessonId]);

  async function submit(result: PracticeResult) {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await recordPracticeResult({
        lessonId: current.pattern.lesson_id,
        patternId: current.pattern.id,
        drillItemId: current.id,
        result,
      });
      setMastery(Number(response.mastery.mastery_score ?? 0));
      setMessage(result === "correct" ? "Correct — mastery updated." : "Saved — this pattern will return sooner.");
      setShowAnswer(false);
      setIndex((value) => (value + 1) % items.length);
    } catch (err) {
      console.error(err);
      setError("نتیجه ذخیره نشد. وارد حساب کاربری شو و اتصال Supabase را بررسی کن.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <State title="Practice" message={error} />;
  }

  return (
    <div className="px-5 pt-7">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-fa text-xs text-amber">PRACTICE · PHASE 7A</p>
          <h1 className="mt-1 font-display text-3xl text-parchment">Recall Practice</h1>
        </div>
        <div className="text-right text-xs text-parchment/50">
          <button onClick={() => navigate("/review")} className="text-amber hover:underline">Review due</button>
          <div className="mt-1">{dueCount === null ? "…" : `${dueCount} due`}</div>
          {progress && <div className="mt-1">{progress}</div>}
        </div>
      </header>

      {!current ? (
        <State title="No drill items yet" message="This lesson does not have Drill Items ready for practice." />
      ) : (
        <>
          <section className="rounded-card bg-ink-soft p-5 shadow-lg">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="rounded-full bg-teal/20 px-3 py-1 text-xs text-teal">Pattern</span>
              {mastery !== null && <span className="text-xs text-amber">Mastery {Math.round(mastery)}%</span>}
            </div>

            <p className="mb-3 text-sm text-parchment/50">Build the English sentence:</p>
            <p className="font-fa text-xl leading-9 text-parchment" dir="rtl">
              {current.sentence_fa}
            </p>

            <div className="mt-6 border-t border-parchment/10 pt-5">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-parchment/35">Pattern</p>
              <p className="font-display text-lg text-amber" dir="ltr">
                {current.pattern.grammar_structure_en}
              </p>
            </div>

            {showAnswer && (
              <div className="mt-5 rounded-2xl bg-ink px-4 py-4">
                <p className="text-xs text-parchment/40">Answer</p>
                <p className="mt-1 font-display text-lg text-parchment" dir="ltr">
                  {current.sentence_en}
                </p>
              </div>
            )}
          </section>

          {message && <p className="mt-4 text-center text-sm text-teal">{message}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              disabled={busy}
              onClick={() => submit("incorrect")}
              className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-4 text-sm text-parchment disabled:opacity-50"
            >
              {busy ? "Saving…" : "✕ Incorrect"}
            </button>
            <button
              disabled={busy}
              onClick={() => submit("correct")}
              className="rounded-2xl bg-amber px-4 py-4 text-sm font-semibold text-ink disabled:opacity-50"
            >
              ✓ Correct
            </button>
          </div>

          {!showAnswer && (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-3 w-full rounded-2xl border border-parchment/10 px-4 py-3 text-sm text-parchment/60"
            >
              Reveal answer
            </button>
          )}
        </>
      )}
    </div>
  );
}

function State({ title, message }: { title: string; message: string }) {
  return (
    <div className="px-5 pt-10 text-center">
      <h1 className="font-display text-2xl text-parchment">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-parchment/50">{message}</p>
    </div>
  );
}
