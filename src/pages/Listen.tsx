import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { AudioSource, Lesson } from "../types/database";

interface AudioRow extends AudioSource {
  lesson?: Pick<Lesson, "title">;
}

export default function Listen() {
  const [items, setItems] = useState<AudioRow[]>([]);

  useEffect(() => {
    supabase
      .from("audio_sources")
      .select("*, lesson:lessons(title)")
      .eq("status", "ready")
      .then(({ data }) => setItems((data as unknown as AudioRow[]) ?? []));
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-6 font-display text-2xl text-parchment">شنیدن آزاد</h1>
      <p className="mb-6 text-sm text-parchment/50">
        فایل‌های صوتی کلاس را بدون توقف اجباری گوش دهید — برای مرور یا Shadowing.
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-card bg-ink-soft px-5 py-4">
            <button
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-amber text-ink"
              aria-label="پخش"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8 5v14l11-7Z" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-parchment">{item.lesson?.title ?? "بدون عنوان"}</p>
              <p className="text-xs text-parchment/40">
                {item.duration_seconds ? `${Math.round(item.duration_seconds / 60)} دقیقه` : "—"}
              </p>
            </div>
          </li>
        ))}

        {items.length === 0 && (
          <p className="rounded-card border border-dashed border-parchment/15 px-5 py-8 text-center text-sm text-parchment/40">
            هنوز فایل صوتی آماده‌ای موجود نیست.
          </p>
        )}
      </ul>
    </div>
  );
}
