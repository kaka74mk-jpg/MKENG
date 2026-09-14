/**
 * DrillPicker
 * -----------
 * چرا این فایل وجود دارد:
 *   حالت «Drill» (شاگرد چهارم) همیشه روی یک Pattern مشخص اجرا می‌شود، نه کل درس.
 *   این صفحه‌ی واسط بین Practice.tsx و DrillSession.tsx است: لیست همه‌ی Patternهایی
 *   که Drill Item دارند را نشان می‌دهد (با عنوان درس مربوطه)، کاربر یکی را انتخاب
 *   می‌کند و به /practice/drill/:patternId می‌رود.
 *
 * مسیر (route): /practice/drill  — در src/App.tsx ثبت شده.
 * از کجا به اینجا می‌رسیم: دکمه‌ی «حالت شاگرد چهارم (Drill)» در Practice.tsx،
 * و همچنین می‌تواند از تب «الگوها» در LessonDetail.tsx به‌طور مستقیم به یک
 * Pattern خاص لینک بدهد (آن بخش هنوز اضافه نشده — کار آینده).
 *
 * نکته: فقط Patternهایی نشان داده می‌شوند که حداقل یک drill_item دارند، وگرنه
 * کاربر وارد یک Drill خالی می‌شود.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Pattern } from "../types/database";

interface PatternRow extends Pattern {
  lesson?: { title: string } | null;
  drill_item_count?: number;
}

export default function DrillPicker() {
  const [patterns, setPatterns] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // select با شمارش drill_items مرتبط (head:false برای گرفتن count واقعی)
      const { data } = await supabase
        .from("patterns")
        .select("*, lesson:lessons(title), drill_items(count)")
        .order("lesson_id")
        .order("order_index");

      const withCounts = (data ?? []).map((row: any) => ({
        ...row,
        drill_item_count: row.drill_items?.[0]?.count ?? 0,
      }));

      setPatterns(withCounts.filter((p) => p.drill_item_count > 0));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-2 font-display text-2xl text-parchment">حالت شاگرد چهارم</h1>
      <p className="mb-6 text-sm text-parchment/50">
        یک الگو انتخاب کن — صدای واقعی کلاس پخش می‌شود، سر جای مکث می‌ایستد تا جواب بدهی، بعد
        پاسخ درست را می‌شنوی.
      </p>

      {loading && <p className="text-sm text-parchment/40">در حال بارگذاری…</p>}

      {!loading && patterns.length === 0 && (
        <div className="rounded-card border border-dashed border-parchment/15 px-5 py-10 text-center">
          <p className="font-display text-lg text-parchment/70">هنوز Drill Item ثبت نشده</p>
          <p className="mt-1 text-sm text-parchment/40">
            برای این کار باید حداقل یک الگو با ردیف‌های drill_items زمان‌بندی‌شده داشته باشید.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {patterns.map((p) => (
          <li key={p.id}>
            <Link
              to={`/practice/drill/${p.id}`}
              className="flex items-center justify-between rounded-card bg-ink-soft px-5 py-4 active:bg-ink"
            >
              <div className="min-w-0">
                <p className="truncate text-parchment" dir="ltr">
                  {p.grammar_structure_en}
                </p>
                <p className="mt-0.5 text-xs text-parchment/40">{p.lesson?.title ?? "بدون عنوان درس"}</p>
              </div>
              <span className="flex-none rounded-full bg-teal/20 px-3 py-1 text-xs text-teal">
                {p.drill_item_count} آیتم
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
