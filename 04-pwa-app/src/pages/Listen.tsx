import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AudioSource, Lesson, LessonListeningProgress } from "../types/database";
import ContinuousAudioPlayer from "../components/ContinuousAudioPlayer";

interface AudioRow extends AudioSource { lesson?: Pick<Lesson, "title">; progress?: LessonListeningProgress | null; }

export default function Listen() {
  const [items, setItems] = useState<AudioRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    async function load() {
      const { data, error: queryError } = await supabase
        .from("audio_sources")
        .select("*, lesson:lessons(title)")
        .eq("status", "ready")
        .order("created_at", { ascending: false });
      if (queryError) { setError(queryError.message); return; }
      const rows = (data as unknown as AudioRow[]) ?? [];
      const ids = rows.map((x) => x.lesson_id);
      const { data: progress } = ids.length ? await supabase.from("lesson_listening_progress").select("*").in("lesson_id", ids) : { data: [] };
      const map = new Map((progress as LessonListeningProgress[] | null ?? []).filter((x) => x.audio_source_id).map((x) => [x.audio_source_id as string, x]));
      setItems(rows.map((x) => ({ ...x, progress: map.get(x.id) ?? null })));
      const userId = (await supabase.auth.getUser()).data.user?.id;
      channel = supabase.channel("listen-progress")
        .on("postgres_changes", { event: "*", schema: "public", table: "lesson_listening_progress", ...(userId ? { filter: `user_id=eq.${userId}` } : {}) }, (payload) => {
          const next = payload.new as LessonListeningProgress;
          setItems((current) => current.map((x) => x.id === next.audio_source_id ? { ...x, progress: next } : x));
        }).subscribe();
    }
    void load();
    return () => { if (channel) void supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="px-5 pt-8 pb-10">
      <p className="text-xs uppercase tracking-[0.2em] text-amber">Classroom audio</p>
      <h1 className="mt-2 font-display text-2xl text-parchment">Listen continuously</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-parchment/50">صدای کلاس دقیقاً همان‌طور که ضبط شده پخش می‌شود. هیچ جمله‌ای به‌صورت اجباری متوقف نمی‌شود. جای شما بین دستگاه‌ها همگام می‌شود.</p>
      {error && <p className="mb-4 rounded-2xl bg-rust/10 px-4 py-3 text-sm text-rust">{error}</p>}
      <div className="space-y-4">
        {items.map((item) => item.storage_path && (
          <article key={item.id} className="space-y-3">
            <div className="px-1"><p className="truncate text-sm font-semibold text-parchment">{item.lesson?.title ?? "Untitled lesson"}</p><p className="mt-1 text-xs text-parchment/35">{item.progress?.completed ? "Completed" : item.progress?.position_seconds ? "Resume from saved position" : "Not started"}</p></div>
            <ContinuousAudioPlayer lessonId={item.lesson_id} source={item} compact />
          </article>
        ))}
        {items.length === 0 && <p className="rounded-card border border-dashed border-parchment/15 px-5 py-8 text-center text-sm text-parchment/40">هنوز فایل صوتی آماده‌ای موجود نیست.</p>}
      </div>
    </div>
  );
}
