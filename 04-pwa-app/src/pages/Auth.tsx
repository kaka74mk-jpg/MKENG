import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionExists(Boolean(data.session));
      setLoading(false);
    });
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      setError("یک ایمیل معتبر وارد کنید.");
      return;
    }

    setSending(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: window.location.origin + "/auth",
      },
    });
    setSending(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setMessage("لینک ورود به ایمیل شما ارسال شد. همان لینک را روی همین دستگاه باز کنید.");
  }

  if (loading) {
    return <Centered text="در حال بررسی نشست…" />;
  }

  if (sessionExists) {
    const target = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={target} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10">
      <div className="w-full max-w-md rounded-card border border-parchment/10 bg-ink-soft p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-amber">MK English Pro</p>
        <h1 className="mt-3 font-display text-3xl text-parchment">ورود به کلاس</h1>
        <p className="mt-3 text-sm leading-7 text-parchment/55">
          برای همگام‌سازی امن بین گوشی و لپ‌تاپ، با لینک یک‌بارمصرف وارد شوید.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs text-parchment/45">ایمیل</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              dir="ltr"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-parchment/10 bg-ink px-4 py-3 text-parchment outline-none focus:border-amber/60"
            />
          </label>
          <button
            disabled={sending}
            className="w-full rounded-2xl bg-amber px-4 py-3 font-semibold text-ink disabled:opacity-50"
          >
            {sending ? "در حال ارسال…" : "ارسال لینک ورود"}
          </button>
        </form>

        {message && <p className="mt-4 rounded-2xl bg-teal/15 px-4 py-3 text-sm text-teal">{message}</p>}
        {error && <p className="mt-4 rounded-2xl bg-rust/10 px-4 py-3 text-sm text-rust">{error}</p>}
      </div>
    </div>
  );
}

function Centered({ text }: { text: string }) {
  return <div className="flex min-h-screen items-center justify-center bg-ink px-5 text-sm text-parchment/50">{text}</div>;
}
