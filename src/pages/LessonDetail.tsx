import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Pattern, VocabularyItem, ExtractedInsight } from "../types/database";

type Tab = "patterns" | "vocabulary" | "insights";

export default function LessonDetail() {
  const { lessonId } = useParams();
  const [tab, setTab] = useState<Tab>("patterns");
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [insights, setInsights] = useState<ExtractedInsight[]>([]);

  useEffect(() => {
    if (!lessonId) return;
    supabase
      .from("patterns")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("order_index")
      .then(({ data }) => setPatterns(data ?? []));
    supabase
      .from("vocabulary")
      .select("*")
      .eq("lesson_id", lessonId)
      .then(({ data }) => setVocabulary(data ?? []));
    supabase
      .from("extracted_insights")
      .select("*")
      .eq("lesson_id", lessonId)
      .eq("reviewed", true)
      .then(({ data }) => setInsights(data ?? []));
  }, [lessonId]);

  return (
    <div className="px-5 pt-6">
      <div className="mb-6 flex gap-2 rounded-card bg-ink-soft p-1">
        <TabButton active={tab === "patterns"} onClick={() => setTab("patterns")}>
          الگوها
        </TabButton>
        <TabButton active={tab === "vocabulary"} onClick={() => setTab("vocabulary")}>
          واژگان
        </TabButton>
        <TabButton active={tab === "insights"} onClick={() => setTab("insights")}>
          نکات پنهان
        </TabButton>
      </div>

      {tab === "patterns" && (
        <ul className="space-y-3">
          {patterns.map((p) => (
            <li key={p.id} className="rounded-card bg-ink-soft px-5 py-4">
              <p className="font-fa text-parchment">{p.grammar_structure_fa}</p>
              <p className="mt-1 font-display text-lg text-amber" dir="ltr">
                {p.grammar_structure_en}
              </p>
              {p.example_en && (
                <p className="mt-2 text-sm text-parchment/60" dir="ltr">
                  {p.example_en}
                </p>
              )}
            </li>
          ))}
          {patterns.length === 0 && <EmptyState text="الگویی برای این درس ثبت نشده." />}
        </ul>
      )}

      {tab === "vocabulary" && (
        <ul className="space-y-3">
          {vocabulary.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-card bg-ink-soft px-5 py-4">
              <div>
                <p className="font-display text-lg text-parchment" dir="ltr">
                  {v.word}
                </p>
                <p className="text-sm text-parchment/50">{v.meaning}</p>
              </div>
              {v.category && (
                <span className="rounded-full bg-teal/20 px-3 py-1 text-xs text-teal">{v.category}</span>
              )}
            </li>
          ))}
          {vocabulary.length === 0 && <EmptyState text="واژه‌ای برای این درس ثبت نشده." />}
        </ul>
      )}

      {tab === "insights" && (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight.id} className="rounded-card border border-amber/25 bg-ink-soft px-5 py-4">
              <p className="text-xs text-amber">{categoryLabel(insight.category)}</p>
              <p className="mt-1 text-parchment">{insight.raw_snippet}</p>
              {insight.ai_expanded_explanation && (
                <p className="mt-2 text-sm text-parchment/60">{insight.ai_expanded_explanation}</p>
              )}
            </li>
          ))}
          {insights.length === 0 && <EmptyState text="نکته‌ی پنهانی برای این درس ثبت نشده." />}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-sm transition-colors ${
        active ? "bg-amber text-ink" : "text-parchment/60"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-card border border-dashed border-parchment/15 px-5 py-8 text-center text-sm text-parchment/40">
      {text}
    </p>
  );
}

function categoryLabel(category: ExtractedInsight["category"]) {
  const map: Record<ExtractedInsight["category"], string> = {
    vocab: "لغت",
    idiom: "اصطلاح",
    grammar_note: "نکته‌ی گرامری",
    pronunciation: "تلفظ",
  };
  return map[category];
}
