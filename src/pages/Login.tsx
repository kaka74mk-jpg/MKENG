import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // After the user taps the magic link in their email, Supabase
        // redirects here and the app auto-detects the session (see
        // supabaseClient.ts: detectSessionInUrl is on by default).
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber/40">
          <div className="h-4 w-4 rounded-full bg-amber" />
        </div>
        <h1 className="font-display text-3xl text-parchment">MK English Pro</h1>
        <p className="mt-2 text-sm text-parchment/50">استاد انگلیسی شخصی شما</p>
      </div>

      {status === "sent" ? (
        <div className="rounded-card bg-ink-soft px-5 py-6 text-center">
          <p className="text-parchment">لینک ورود برای شما ایمیل شد ✉️</p>
          <p className="mt-2 text-sm text-parchment/50" dir="ltr">
            {email}
          </p>
          <p className="mt-4 text-xs leading-6 text-parchment/40">
            صندوق ورودی (و پوشه‌ی اسپم) را چک کنید و روی لینک بزنید — همین صفحه به‌طور خودکار
            وارد اپ می‌شود.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-5 text-sm text-teal underline underline-offset-4"
          >
            ارسال دوباره یا اصلاح ایمیل
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-parchment/60">
              ایمیل
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-card border border-parchment/15 bg-ink-soft px-4 py-4 text-parchment placeholder:text-parchment/30 focus:border-amber/60"
              required
            />
          </div>

          {status === "error" && (
            <p className="rounded-card bg-rust/10 px-4 py-3 text-sm text-rust" dir="rtl">
              مشکلی پیش آمد: {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-card bg-amber px-5 py-4 text-center font-display text-ink disabled:opacity-50"
          >
            {status === "sending" ? "در حال ارسال…" : "دریافت لینک ورود"}
          </button>

          <p className="pt-2 text-center text-xs leading-6 text-parchment/40">
            رمز عبور لازم نیست — فقط یک لینک به ایمیل شما ارسال می‌شود.
          </p>
        </form>
      )}
    </div>
  );
}
