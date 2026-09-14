import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Lesson, LessonProgress } from "../types/database";

interface LessonRow extends Lesson {
  progress?: LessonProgress;
}

export default function Learn() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("*")
        .eq("status", "published")
        .order("order_index", { ascending: true });

      const { data: progressRows } = await supabase.from("lesson_progress").select("*");

      const merged = (lessonRows ?? []).map((lesson) => ({
        ...lesson,
        progress: progressRows?.find((p) => p.lesson_id === lesson.id),
      }));

      setLessons(merged);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-6 font-display text-2xl text-parchment">مسیر یادگیری</h1>

      {loading && <p className="text-sm text-parchment/40">در حال بارگذاری…</p>}

      {!loading && lessons.length === 0 && (
        <div className="rounded-card border border-dashed border-parchment/15 px-5 py-10 text-center">
          <p className="font-display text-lg text-parchment/70">هنوز درسی منتشر نشده</p>
          <p className="mt-1 text-sm text-parchment/40">
            از بخش مدیریت محتوا یک درس بسازید تا اینجا نمایش داده شود.
          </p>
        </div>
      )}

      <ol className="divide-y divide-parchment/10 overflow-hidden rounded-card bg-ink-soft">
        {lessons.map((lesson, index) => {
          const locked = lesson.progress?.status === "locked" || !lesson.progress;
          const completed = lesson.progress?.status === "completed";
          return (
            <li key={lesson.id}>
              <Link
                to={locked ? "#" : `/learn/${lesson.id}`}
                aria-disabled={locked}
                className={`flex items-center gap-4 px-5 py-4 ${
                  locked ? "pointer-events-none opacity-40" : "active:bg-ink"
                }`}
              >
                <span className="font-display text-sm text-parchment/40" dir="ltr">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate text-parchment">{lesson.title}</span>
                {completed ? (
                  <span className="text-teal">✓</span>
                ) : locked ? (
                  <LockIcon />
                ) : (
                  <span className="text-xs text-amber">در دسترس</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4 w-4 text-parchment/30">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}
