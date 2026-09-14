import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSignedAudioUrl } from "../hooks/useSignedAudioUrl";
import type { AudioSource, Lesson } from "../types/database";

interface AudioRow extends AudioSource { lesson?: Pick<Lesson, "title">; }

function Player({ path }: { path: string | null }) {
  const { url, loading } = useSignedAudioUrl(path);
  if (!path) return <span className="text-xs text-parchment/40">بدون فایل</span>;
  if (loading) return <span className="text-xs text-parchment/40">...</span>;
  return <audio controls preload="none" className="max-w-full" src={url ?? undefined} />;
}

export default function Listen() {
  const [items, setItems] = useState<AudioRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("audio_sources")
        .select("*, lesson:lessons(title)")
        .eq("status", "ready")
        .not("storage_path", "is", null)
        .order("created_at", { ascending: false });
      setItems((data as unknown as AudioRow[]) ?? []);
    };
    load();

    const channel = supabase
      .channel("audio_sources_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "audio_sources" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-6 font-display text-2xl text-parchment">شنیدن آزاد</h1>
      <p className="mb-6 text-sm text-parchment/50">فایل‌های صوتی کلاس را بدون توقف اجباری گوش دهید.</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-card bg-ink-soft px-5 py-4 space-y-3">
            <p className="truncate text-parchment">{item.lesson?.title ?? "بدون عنوان"}</p>
            <Player path={item.storage_path} />
          </li>
        ))}
        {items.length === 0 && <p className="rounded-card border border-dashed border-parchment/15 px-5 py-8 text-center text-sm text-parchment/40">هنوز فایل صوتی آماده‌ای موجود نیست.</p>}
      </ul>
    </div>
  );
}
