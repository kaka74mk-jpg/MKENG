/**
 * Practice
 * --------
 * صفحه‌ی منوی تمرین با ۳ گزینه. فقط گزینه‌ی وسط («حالت شاگرد چهارم») در فاز ۲
 * به یک صفحه‌ی واقعی وصل شده است (/practice/drill). دو گزینه‌ی دیگر
 * («مرور فاصله‌دار» و «مکالمه‌ی آزاد با AI») هنوز غیرفعال‌اند — کار فازهای بعدی.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Practice() {
  const [dueCount, setDueCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .lte("next_review_at", new Date().toISOString())
      .then(({ count }) => setDueCount(count ?? 0));
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-6 font-display text-2xl text-parchment">تمرین</h1>

      <div className="space-y-3">
        <PracticeOption
          title="مرور واژگان و الگوها"
          subtitle={dueCount === null ? "…" : `${dueCount} آیتم آماده‌ی مرور`}
          accent="amber"
          disabled
        />
        <PracticeOption
          title="حالت شاگرد چهارم (Drill)"
          subtitle="تمرین با صدای واقعی کلاس"
          accent="teal"
          to="/practice/drill"
        />
        <PracticeOption
          title="مکالمه‌ی آزاد با AI"
          subtitle="اصلاح خطا و پیشنهاد جمله‌ی بهتر"
          accent="parchment"
          disabled
        />
      </div>
    </div>
  );
}

function PracticeOption({
  title,
  subtitle,
  accent,
  to,
  disabled,
}: {
  title: string;
  subtitle: string;
  accent: "amber" | "teal" | "parchment";
  to?: string;
  disabled?: boolean;
}) {
  const dot = { amber: "bg-amber", teal: "bg-teal", parchment: "bg-parchment" }[accent];
  const content = (
    <>
      <span className={`h-2.5 w-2.5 flex-none rounded-full ${dot}`} />
      <span className="flex-1">
        <span className="block font-display text-lg text-parchment">{title}</span>
        <span className="block text-xs text-parchment/50">{subtitle}</span>
      </span>
      {disabled && <span className="flex-none text-xs text-parchment/30">به‌زودی</span>}
    </>
  );

  if (to && !disabled) {
    return (
      <Link
        to={to}
        className="flex w-full items-center gap-4 rounded-card bg-ink-soft px-5 py-5 text-right active:bg-ink"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-card bg-ink-soft px-5 py-5 text-right disabled:opacity-50"
    >
      {content}
    </button>
  );
}
