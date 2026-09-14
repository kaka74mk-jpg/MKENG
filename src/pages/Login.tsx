import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

type Mode = "login" | "signup";

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const resetStatus = () => {
    setStatus("idle");
    setMessage("");
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    resetStatus();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) return;

    if (mode === "signup" && password !== confirmPassword) {
      setStatus("error");
      setMessage("تکرار رمز عبور با رمز عبور یکسان نیست.");
      return;
    }

    if (password.length < 6) {
      setStatus("error");
      setMessage("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    setStatus("busy");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage("ورود موفق بود.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    // Depending on the Supabase project's email-confirmation setting,
    // a new account may require email confirmation before the first login.
    setStatus("success");
    setMessage(
      data.session
        ? "حساب ساخته شد و وارد شدید."
        : "حساب ساخته شد. ایمیل تأیید را بررسی کنید و سپس با همین رمز وارد شوید."
    );
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setStatus("error");
      setMessage("ابتدا ایمیل را وارد کنید.");
      return;
    }

    setStatus("busy");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("لینک بازیابی رمز عبور به ایمیل شما ارسال شد.");
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber/40">
          <div className="h-4 w-4 rounded-full bg-amber" />
        </div>
        <h1 className="font-display text-3xl text-parchment">MK English Pro</h1>
        <p className="mt-2 text-sm text-parchment/50">استاد انگلیسی شخصی شما</p>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-card bg-ink-soft p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`rounded-card px-4 py-3 text-sm transition ${
            mode === "login" ? "bg-amber text-ink" : "text-parchment/60"
          }`}
        >
          ورود
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`rounded-card px-4 py-3 text-sm transition ${
            mode === "signup" ? "bg-amber text-ink" : "text-parchment/60"
          }`}
        >
          ساخت حساب
        </button>
      </div>

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
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") resetStatus();
            }}
            className="w-full rounded-card border border-parchment/15 bg-ink-soft px-4 py-4 text-parchment placeholder:text-parchment/30 focus:border-amber/60"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-parchment/60">
            رمز عبور
          </label>
          <input
            id="password"
            type="password"
            dir="ltr"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="حداقل ۶ کاراکتر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-card border border-parchment/15 bg-ink-soft px-4 py-4 text-parchment placeholder:text-parchment/30 focus:border-amber/60"
            minLength={6}
            required
          />
        </div>

        {mode === "signup" && (
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm text-parchment/60">
              تکرار رمز عبور
            </label>
            <input
              id="confirm-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              placeholder="رمز عبور را دوباره وارد کنید"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-card border border-parchment/15 bg-ink-soft px-4 py-4 text-parchment placeholder:text-parchment/30 focus:border-amber/60"
              minLength={6}
              required
            />
          </div>
        )}

        {status === "error" && (
          <p className="rounded-card bg-rust/10 px-4 py-3 text-sm text-rust" dir="rtl">
            {message}
          </p>
        )}

        {status === "success" && (
          <p className="rounded-card bg-teal/10 px-4 py-3 text-sm text-teal" dir="rtl">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "busy"}
          className="w-full rounded-card bg-amber px-5 py-4 text-center font-display text-ink disabled:opacity-50"
        >
          {status === "busy" ? "لطفاً صبر کنید…" : mode === "login" ? "ورود" : "ساخت حساب"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={status === "busy"}
            className="w-full text-sm text-teal underline underline-offset-4 disabled:opacity-50"
          >
            رمز عبور را فراموش کرده‌ام
          </button>
        )}
      </form>
    </div>
  );
}
