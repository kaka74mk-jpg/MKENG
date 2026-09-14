/**
 * App
 * ---
 * ریشه‌ی اپلیکیشن. دو مسئولیت دارد:
 *  ۱) دروازه‌ی Auth: تا زمانی که session وجود ندارد فقط <Login /> نشان داده
 *     می‌شود (فاز ۱). بعد از ورود، بقیه‌ی روت‌ها فعال می‌شوند.
 *  ۲) نقشه‌ی کامل روت‌های اپ:
 *       /                         Home.tsx        (استریک/XP/ادامه‌ی مسیر)
 *       /learn                    Learn.tsx        (فهرست درس‌ها)
 *       /learn/:lessonId          LessonDetail.tsx  (الگو/واژگان/نکات پنهان)
 *       /listen                   Listen.tsx        (شنیدن آزاد)
 *       /practice                 Practice.tsx      (منوی مرور/Drill/مکالمه)
 *       /practice/drill           DrillPicker.tsx    (فاز ۲ — انتخاب الگو برای Drill)
 *       /practice/drill/:patternId DrillSession.tsx  (فاز ۲ — پخش‌کننده‌ی اصلی Drill)
 *       /profile                  Profile.tsx        (خروج از حساب)
 */
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Listen from "./pages/Listen";
import Practice from "./pages/Practice";
import Profile from "./pages/Profile";
import LessonDetail from "./pages/LessonDetail";
import DrillPicker from "./pages/DrillPicker";
import DrillSession from "./pages/DrillSession";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for an existing session on first load.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Keep session in sync (login, logout, magic-link redirect, token refresh).
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <Login />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:lessonId" element={<LessonDetail />} />
          <Route path="/listen" element={<Listen />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/drill" element={<DrillPicker />} />
          <Route path="/practice/drill/:patternId" element={<DrillSession />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
