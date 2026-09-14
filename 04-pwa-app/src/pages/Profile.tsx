import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Profile() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-6 font-display text-2xl text-parchment">پروفایل</h1>

      <div className="mb-6 rounded-card bg-ink-soft px-5 py-5">
        <p className="text-xs text-parchment/40">وارد شده به‌عنوان</p>
        <p className="mt-1 text-parchment" dir="ltr">
          {email ?? "—"}
        </p>
      </div>

      <Link to="/mastery" className="mb-3 block rounded-2xl bg-ink-soft px-4 py-3 text-center text-sm text-parchment/70">View mastery dashboard</Link>
      <Link to="/creator" className="mb-3 block rounded-2xl bg-amber px-4 py-3 text-center text-sm font-semibold text-ink">Creator Mode</Link>
      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full rounded-card border border-rust/40 px-5 py-4 text-center text-rust"
      >
        خروج از حساب
      </button>
    </div>
  );
}
