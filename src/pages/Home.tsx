import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { UserStats } from "../types/database";

export default function Home() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    supabase
      .from("user_stats")
      .select("*")
      .maybeSingle()
      .then(({ data }) => setStats(data));
  }, []);

  return (
    <div className="px-5 pt-8">
      <header className="mb-8">
        <p className="font-fa text-sm text-parchment/50">امروز</p>
        <h1 className="font-display text-3xl leading-tight text-parchment">
          آماده‌ی درس بعدی هستید
        </h1>
      </header>

      {/* Streak + XP — a strip, not a grid of identical stat cards */}
      <div className="mb-8 flex items-center justify-between rounded-card bg-ink-soft px-5 py-4">
        <div>
          <p className="text-2xl font-display text-amber">{stats?.current_streak ?? 0}</p>
          <p className="text-xs text-parchment/50">روز پیاپی</p>
        </div>
        <div className="h-8 w-px bg-parchment/10" />
        <div>
          <p className="text-2xl font-display text-parchment">{stats?.xp ?? 0}</p>
          <p className="text-xs text-parchment/50">XP</p>
        </div>
        <div className="h-8 w-px bg-parchment/10" />
        <div>
          <p className="text-2xl font-display text-teal">
            {Math.round((stats?.listening_seconds_total ?? 0) / 60)}
          </p>
          <p className="text-xs text-parchment/50">دقیقه شنیدن</p>
        </div>
      </div>

      {/* Continue hero — the tape spool motif as the one bold element */}
      <Link
        to="/learn"
        className="relative flex items-center gap-4 overflow-hidden rounded-card bg-parchment px-5 py-6 text-ink"
      >
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full border-2 border-ink/15">
          <div className="h-3 w-3 rounded-full bg-ink" />
        </div>
        <div>
          <p className="text-xs text-ink/50">ادامه‌ی مسیر</p>
          <p className="font-display text-xl">درس بعدی را شروع کنید</p>
        </div>
      </Link>
    </div>
  );
}
