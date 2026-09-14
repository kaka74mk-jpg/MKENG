import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { AiContentDraft, AiContentType, Lesson, LessonTranscript } from "../types/database";

type Notice = { kind: "ok" | "error"; text: string } | null;

export default function StudyLab() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [transcript, setTranscript] = useState<LessonTranscript | null>(null);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<AiContentDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function load() {
    if (!lessonId) return;
    const [{ data: lessonData }, { data: transcriptData }, { data: draftData }] = await Promise.all([
      supabase.from("lessons").select("*").eq("id", lessonId).single(),
      supabase.from("lesson_transcripts").select("*").eq("lesson_id", lessonId).maybeSingle(),
      supabase.from("ai_content_drafts").select("*").eq("lesson_id", lessonId).order("created_at", { ascending: false }),
    ]);
    setLesson((lessonData as Lesson | null) ?? null);
    setTranscript((transcriptData as LessonTranscript | null) ?? null);
    setText(transcriptData?.full_text ?? "");
    setDrafts((draftData as AiContentDraft[] | null) ?? []);
  }

  useEffect(() => { void load(); }, [lessonId]);

  async function saveTranscript() {
    if (!lessonId || !text.trim()) return;
    setBusy(true); setNotice(null);
    const { data, error } = await supabase.from("lesson_transcripts").upsert({
      lesson_id: lessonId, user_id: (await supabase.auth.getUser()).data.user?.id, source: "manual", language: "en", full_text: text.trim(), status: "ready", updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" }).select().single();
    setBusy(false);
    if (error) return setNotice({ kind: "error", text: error.message });
    setTranscript(data as LessonTranscript); setNotice({ kind: "ok", text: "Transcript ذخیره شد." });
  }

  async function generate() {
    if (!lessonId || !transcript) return setNotice({ kind: "error", text: "ابتدا Transcript را ذخیره کنید." });
    setBusy(true); setNotice(null);
    const { data, error } = await supabase.functions.invoke("ai-study-material", { body: { lesson_id: lessonId, transcript_id: transcript.id } });
    setBusy(false);
    if (error || data?.error) return setNotice({ kind: "error", text: error?.message ?? data?.error });
    await load();
    setNotice({ kind: "ok", text: "مواد آموزشی به‌صورت Draft ساخته شد؛ هنوز وارد محتوای رسمی نشده است." });
  }

  async function review(draft: AiContentDraft, action: "approved" | "rejected") {
    if (!lessonId) return;
    setBusy(true); setNotice(null);
    try {
      if (action === "approved") {
        const { error } = await supabase.rpc("publish_ai_content_draft", { p_draft_id: draft.id });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("ai_content_drafts").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", draft.id).eq("status", "pending");
        if (error) throw new Error(error.message);
      }
      await load();
      setNotice({ kind: "ok", text: action === "approved" ? "مورد تأیید و به‌صورت اتمیک به محتوای رسمی اضافه شد." : "مورد رد شد." });
    } catch (e) { setNotice({ kind: "error", text: e instanceof Error ? e.message : "عملیات ناموفق بود." }); }
    finally { setBusy(false); }
  }

  const pending = useMemo(() => drafts.filter((d) => d.status === "pending"), [drafts]);

  return <div className="px-5 pt-7 pb-10">
    <p className="text-xs uppercase tracking-[0.2em] text-amber">Phase 9 · Study Lab</p>
    <h1 className="mt-2 font-display text-2xl text-parchment">Transcript Intelligence</h1>
    <p className="mt-2 text-sm leading-6 text-parchment/50">{lesson?.title ?? "Lesson"} — صدای اصلی این بخش را کنترل نمی‌کند؛ اینجا فقط از Transcript برای ساخت محتوای مطالعه استفاده می‌شود.</p>

    <section className="mt-6 rounded-card bg-ink-soft p-5">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg text-parchment">1. Transcript</h2><span className="text-xs text-teal">{transcript ? "Saved" : "Not saved"}</span></div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste the lesson transcript here…" dir="ltr" className="mt-4 min-h-72 w-full rounded-2xl bg-ink px-4 py-4 text-sm leading-7 text-parchment outline-none" />
      <button onClick={() => void saveTranscript()} disabled={busy || !text.trim()} className="mt-3 w-full rounded-2xl bg-amber px-4 py-3 text-sm font-semibold text-ink disabled:opacity-50">Save Transcript</button>
    </section>

    <section className="mt-4 rounded-card bg-ink-soft p-5">
      <h2 className="font-display text-lg text-parchment">2. Generate study material</h2>
      <p className="mt-2 text-sm leading-6 text-parchment/50">AI از Transcript الگو، واژه، نکته و تمرین می‌سازد. هیچ موردی بدون Review وارد محتوای رسمی نمی‌شود.</p>
      <button onClick={() => void generate()} disabled={busy || !transcript} className="mt-4 w-full rounded-2xl border border-amber/30 px-4 py-3 text-sm font-semibold text-amber disabled:opacity-40">{busy ? "Working…" : "Generate AI Drafts"}</button>
    </section>

    <section className="mt-4 space-y-3">
      <div className="flex items-center justify-between"><h2 className="font-display text-lg text-parchment">3. Human Review</h2><span className="text-xs text-parchment/40">{pending.length} pending</span></div>
      {pending.length === 0 && <p className="rounded-card border border-dashed border-parchment/15 px-5 py-8 text-center text-sm text-parchment/40">هنوز Draft منتظری وجود ندارد.</p>}
      {pending.map((draft) => <DraftCard key={draft.id} draft={draft} busy={busy} onReview={review} />)}
    </section>
    {notice && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${notice.kind === "ok" ? "bg-teal/15 text-teal" : "bg-rust/10 text-rust"}`}>{notice.text}</div>}
  </div>;
}

function DraftCard({ draft, busy, onReview }: { draft: AiContentDraft; busy: boolean; onReview: (d: AiContentDraft, a: "approved" | "rejected") => void }) {
  const p = draft.payload as Record<string, string | number>;
  const labels: Record<AiContentType, string> = { pattern: "Pattern", vocabulary: "Vocabulary", insight: "Insight", exercise: "Exercise" };
  return <article className="rounded-card border border-parchment/10 bg-ink-soft p-5">
    <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-amber/15 px-3 py-1 text-[11px] text-amber">{labels[draft.content_type]}</span><span className="text-[11px] text-parchment/35">AI Draft</span></div>
    {draft.content_type === "pattern" && <><p className="mt-3 font-display text-lg text-amber" dir="ltr">{String(p.grammar_structure_en)}</p><p className="mt-1 text-sm text-parchment/70">{String(p.grammar_structure_fa)}</p><p className="mt-3 text-sm text-parchment/55" dir="ltr">{String(p.example_en)}</p></>}
    {draft.content_type === "vocabulary" && <><p className="mt-3 font-display text-lg text-parchment" dir="ltr">{String(p.word)}</p><p className="text-sm text-parchment/60">{String(p.meaning)}</p><p className="mt-2 text-sm text-parchment/50" dir="ltr">{String(p.example)}</p></>}
    {draft.content_type === "insight" && <><p className="mt-3 text-sm text-amber">{String(p.category)}</p><p className="mt-1 text-sm text-parchment">{String(p.raw_snippet)}</p><p className="mt-2 text-sm leading-6 text-parchment/55">{String(p.explanation)}</p></>}
    {draft.content_type === "exercise" && <><p className="mt-3 text-sm text-parchment">{String(p.prompt_fa)}</p><p className="mt-2 text-sm text-amber" dir="ltr">{String(p.answer_en)}</p><p className="mt-1 text-[11px] text-parchment/35" dir="ltr">Pattern: {String(p.pattern_structure_en)}</p></>}
    <div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => onReview(draft, "approved")} className="flex-1 rounded-xl bg-teal/20 py-2.5 text-xs font-semibold text-teal">Approve</button><button disabled={busy} onClick={() => onReview(draft, "rejected")} className="flex-1 rounded-xl bg-rust/10 py-2.5 text-xs font-semibold text-rust">Reject</button></div>
  </article>;
}
