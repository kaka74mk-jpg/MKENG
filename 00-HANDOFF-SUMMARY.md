# MK English Pro — سند وضعیت پروژه (Handoff)

**تاریخ آخرین به‌روزرسانی:** این سند خلاصه‌ی کامل تصمیمات و کارهای انجام‌شده تا این لحظه است.
اگر در یک چت جدید با Claude ادامه می‌دهید، **همین یک فایل را آپلود کنید** — تمام context لازم اینجاست.

---

## ۱. پروژه چیست

**MK English Pro** یک PWA شخصی (نه محصول تجاری/عمومی) برای یادگیری انگلیسی است که حول یک روش خاص کلاس‌داری
می‌چرخد: **Substitution Drill (Call & Response)**. استاد یک جمله‌ی فارسی می‌گوید، شاگردان سریع معادل
انگلیسی را با یک ساختار گرامری ثابت می‌گویند، و استاد با جایگزینی واژه ادامه می‌دهد. کاربر اپ («شما»)
در نقش **«شاگرد چهارم»** قرار می‌گیرد و هم‌زمان با ضبط صوتی واقعی کلاس تمرین می‌کند.

### مقیاس پروژه
- **کاملاً شخصی است** — فقط خودتان استفاده می‌کنید، شاید در چند دستگاه (گوشی + لپ‌تاپ).
- به همین دلیل خیلی از پیچیدگی‌های معمول (multi-tenant، مقیاس‌پذیری بالا، سیستم پیچیده‌ی نقش‌ها) **عمداً حذف شده‌اند**.

### دو سند اولیه‌ی پروژه (در پوشه‌ی `01-architecture-docs/`)
- `MK_English_Pro_AI_Architecture.txt` — نسخه‌ی اولیه‌ی انگلیسی، کلی‌تر
- `MK_English_Pro_Architecture.md` — نسخه‌ی نهایی و دقیق فارسی؛ **این سند مرجع اصلی طراحی است**

---

## ۲. تصمیمات کلیدی که تا الان گرفته شده

| تصمیم | دلیل |
|---|---|
| فایل‌های صوتی از Google Drive (لینک‌های Public) به Supabase Storage **منتقل/کپی** می‌شوند، نه پخش مستقیم | گوگل درایو برای Range Requests و Offline Caching قابل‌اعتماد نیست؛ کوئوتای دانلود دارد |
| این انتقال با یک **Edge Function** (سمت سرور) انجام می‌شود، نه در فرانت‌اند | مشکل CORS، حجم فایل، و نگه‌داشتن منطق حساس دور از کلاینت |
| ساختار محتوا: `Package → Level → Season → Chapter → Lesson → Pattern → Drill Item` | مطابق سند فارسی؛ تفاوت اصلی با نسخه‌ی اول: تمرکز روی Pattern/Drill به‌جای فقط Vocabulary |
| محتوای هر درس از **PDF + صدا** تغذیه می‌شود (PDF اولویت اول برای ساختار رسمی، صدا برای نکات ضمنی) | کاهش ریسک Hallucination در استخراج Pattern از صدای نویزدار |
| با این‌حال همچنان از **Supabase Auth** استفاده می‌کنیم (even for one user) | چون PWA روی وب پابلیک است؛ برای Sync امن بین چند دستگاه لازم است |
| هر جدول دیتابیس یک `user_id` دارد + Row Level Security فعال روی همه | امنیت رایگان، بدون پیچیدگی اضافه برای تک‌کاربر بودن |
| باکت‌های Storage همه **Private** هستند (نه Public) | پخش فقط از طریق Signed URL موقت |
| طراحی بصری: پالت «نوار کاست کلاس زبان» (Ink Navy / Parchment / Amber / Teal) — نه پالت رایج SaaS یا کرم/تراکوتای معمول AI-generated | تمایز بصری واقعی، متناسب با ماهیت محصول (کلاس صوتی ضبط‌شده) |
| فونت‌ها: **Vazirmatn** برای فارسی، **Fraunces** برای تیترها | محتوا دائم بین فارسی/انگلیسی سوییچ می‌کند |

---

## ۳. کارهایی که کامل انجام شده

### الف) دیتابیس (Supabase) — پوشه‌ی `02-database/`

دو فایل SQL که **باید به همین ترتیب** در Supabase SQL Editor اجرا شوند:

1. **`mk_english_pro_schema.sql`**
   - همه‌ی Enum typeها (level_code, turn_type, insight_category, و...)
   - ۱۹ جدول شامل: ساختار محتوا (packages تا lessons)، صدا و ترنسکریپت (`audio_sources`, `transcript_turns`)،
     Drill (`patterns`, `drill_items`, `voice_recordings`)، واژگان (`vocabulary`)،
     نکات ضمنی (`extracted_insights`)، یادداشت‌ها (`notes`)، پیشرفت (`lesson_progress`, `pattern_mastery`)،
     مرور فاصله‌دار (`reviews`)، گیمیفیکیشن (`user_stats`, `achievements`, `daily_challenges`)
   - Indexها روی فیلدهای پرکاربرد
   - RLS فعال روی همه‌ی جدول‌ها + پالیسی خودکار (`auth.uid() = user_id`) با یک حلقه‌ی `do $$ ... $$`

   ✅ **این فایل توسط شما اجرا شده و تأیید شده که درست کار کرده.**

2. **`mk_english_pro_storage.sql`**
   - ۴ باکت Storage: `lesson-audio` (۲۰۰MB سقف)، `lesson-pdfs` (۵۰MB)، `vocab-audio` (۱۰MB)، `voice-recordings` (۲۰MB)
   - همه Private، با محدودیت نوع فایل (`allowed_mime_types`)
   - پالیسی‌های owner-only روی `storage.objects` — قرارداد مسیر: `{user_id}/{lesson_id}/{filename}`

   ✅ **این فایل هم اجرا و تأیید شده.**

### ب) Edge Function — پوشه‌ی `03-edge-functions/import-drive-audio/`

فایل `index.ts` — یک Supabase Edge Function (Deno) که:
1. هویت کاربر را از JWT تأیید می‌کند
2. لینک گوگل درایو را می‌گیرد، File ID را استخراج می‌کند (۳ فرمت رایج لینک را پشتیبانی می‌کند)
3. فایل را دانلود می‌کند — شامل هندل کردن خودکار صفحه‌ی «Google Drive can't scan for viruses» که برای فایل‌های بزرگ ظاهر می‌شود
4. در باکت `lesson-audio` آپلود می‌کند
5. رکورد `audio_sources` را آپدیت می‌کند (`storage_path`, `format`, `status='ready'`)
6. در هر مرحله خطا، `status='error'` با پیام فارسی کاربرپسند ثبت می‌کند

⚠️ **این فایل نوشته شده ولی هنوز Deploy و تست نشده.**
دستورات Deploy در `README.md` داخل `04-pwa-app/` هست (بخش "چطور کار می‌کنه").

### ج) اسکلت PWA — پوشه‌ی `04-pwa-app/`

پروژه‌ی React + Vite + TypeScript + Tailwind با پشتیبانی PWA کامل (`vite-plugin-pwa`).

**فایل‌های پیکربندی:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `.env.example`, `.gitignore`

**کد اپلیکیشن:**
- `src/lib/supabaseClient.ts` — کلاینت تایپ‌شده‌ی Supabase
- `src/types/database.ts` — تایپ‌های TypeScript منطبق با اسکیمای دیتابیس (دستی نوشته شده؛ می‌توان بعداً با `supabase gen types` جایگزین کرد)
- `src/components/BottomNav.tsx` — ناوبری پایین با ۵ تب (Home, Learn, Listen, Practice, Profile) با آیکون‌های SVG دست‌ساز
- `src/App.tsx` — روتینگ اصلی
- `src/pages/Home.tsx` — استریک، XP، دقیقه‌ی شنیدن، دکمه‌ی «ادامه‌ی مسیر»
- `src/pages/Learn.tsx` — فهرست درس‌ها به شکل «ترک‌های نوار کاست» با شماره‌گذاری، وضعیت قفل/تکمیل
- `src/pages/Listen.tsx` — فهرست فایل‌های صوتی آماده برای شنیدن آزاد
- `src/pages/Practice.tsx` — ۳ گزینه: مرور فاصله‌دار، حالت Drill، مکالمه‌ی آزاد با AI
- `src/pages/Profile.tsx` — نمایش ایمیل کاربر، دکمه‌ی خروج
- `src/pages/LessonDetail.tsx` — صفحه‌ی یک درس با ۳ تب: الگوها / واژگان / «نکات پنهان این درس»

⚠️ **این کد نوشته شده ولی هرگز `npm install` یا اجرا نشده** (چون Sandbox من به اینترنت دسترسی ندارد).
ممکن است در اولین اجرا نیاز به رفع چند خطای کوچک TypeScript/import داشته باشد.

---

## ۴. کارهایی که هنوز شروع نشده (اولویت‌بندی پیشنهادی)

1. **صفحه‌ی Auth (لاگین)** — فعلاً اپ فرض می‌کند کاربر لاگین کرده؛ باید صفحه‌ی ورود واقعی ساخته شود
   (چون تک‌کاربره، می‌تواند خیلی ساده باشد — مثلاً فقط Magic Link ایمیل)
2. **پخش‌کننده‌ی صوتی با توقف خودکار روی `drill_pause`** — قلب اصلی حالت «شاگرد چهارم»؛ پیچیده‌ترین بخش فنی باقی‌مانده
3. **ضبط صدای کاربر** و آپلود به باکت `voice-recordings` + مقایسه با پاسخ اصلی
4. **Service Worker caching اختصاصی برای صدا** (جدا از app shell، چون فایل‌های صوتی بزرگ‌اند)
5. **صفحه‌ی Creator Mode** — رابط برای ساخت درس جدید، آپلود PDF، وارد کردن لینک Drive (که Edge Function را صدا می‌زند)
6. **پایپ‌لاین AI**: Speech-to-Text، Turn Segmentation، Forced Alignment، استخراج Pattern/Vocabulary/Insights (این بخش هنوز اصلاً طراحی فنی نشده، فقط در سند معماری توصیف شده)
7. **Auth واقعی برای Edge Function در production** (فعلاً منطق پایه نوشته شده ولی deploy نشده)
8. **آیکون‌های واقعی PWA** (`icon-192.png`, `icon-512.png`) — الان فقط placeholder متنی هستند

---

## ۵. چطور در یک چت جدید ادامه بدهید

فقط کافیست:
1. همین فایل (`00-HANDOFF-SUMMARY.md`) را آپلود کنید
2. اگر می‌خواهید Claude کد را ببیند/ویرایش کند، فایل‌های مربوطه از پوشه‌ی `04-pwa-app/` یا `02-database/` را هم آپلود کنید (یا کل پوشه را zip کرده و بگویید کدام بخش را می‌خواهید ادامه دهید)
3. بگویید از کدام آیتم بخش «۴» می‌خواهید شروع کنید

---

## ۶. نکات فنی مهم برای یادآوری

- **همه‌ی باکت‌های Storage Private هستند** — همیشه از Signed URL استفاده کنید، هرگز فرض نکنید لینک عمومی است.
- **مسیر فایل‌ها باید با `{user_id}/` شروع شود** وگرنه RLS رد می‌کند.
- **کلید `service_role`** فقط باید در Edge Function (سمت سرور) باشد، هرگز در کد فرانت‌اند.
- زبان رابط کاربری: فارسی (`dir="rtl"` روی `<html>`)، ولی متن انگلیسی داخل محتوا با `dir="ltr"` ایزوله می‌شود تا جهت متن به‌هم نریزد.
- نسخه‌ی فارسی سند معماری (`MK_English_Pro_Architecture.md`) مرجع اصلی است، نه نسخه‌ی انگلیسی — نسخه‌ی انگلیسی قدیمی‌تر و کلی‌تر است.

---

# 10. Phase 7D — Mastery Dashboard — COMPLETE

Phase 7D is complete in this repository.

### Added

- `/mastery` route.
- `src/pages/MasteryDashboard.tsx`.
- `src/lib/masteryDashboard.ts`.
- Profile → Mastery Dashboard navigation.
- Updated progress documentation.

### Dashboard behavior

The dashboard uses the existing Supabase source of truth:

- `learner_mastery`
- `patterns`
- `practice_attempts`
- `get_due_reviews()`

It shows:

- overall mastery average
- tracked Pattern count
- due reviews
- Needs work / Developing / Solid+ counts
- last-7-day recall attempts and accuracy
- all / needs attention / due now filters
- Pattern score, mastery band, correct/incorrect counts, exposures, and due state
- direct Review and AI Coach actions

No second mastery algorithm was introduced.

### Current roadmap

**Phase 7D / 10 — COMPLETE**

Completed sequence:

`7A → 7B → 7C → 7D`

Remaining:

`Phase 8 → Phase 9 → Phase 10`

### Next phase

**Phase 8 — Auth + Creator Mode + Audio Import production-ready — COMPLETE**

Start with real Supabase Auth/session protection, then production deployment/testing of the Google Drive import Edge Function, followed by Creator Mode and content ingestion UI.

If work is interrupted, read `07-PHASE7D-HANDOFF.md` after the two main continuation documents.


---

## Phase 8 continuation

Phase 8 is complete. Read `08-PHASE8-HANDOFF.md` for the exact implementation state and next step. The next milestone is **Phase 9 — Transcript + AI Extraction**.

---

## Phase 9 continuation — COMPLETE

Phase 9 has been implemented with the corrected product philosophy: **audio and study intelligence are separate layers**.

### Phase 9 implementation

Added:
- `02-database/09_phase9_transcript_intelligence.sql`
- `04-pwa-app/supabase/sql/09_phase9_transcript_intelligence.sql`
- `04-pwa-app/supabase/functions/ai-study-material/index.ts`
- `04-pwa-app/src/pages/StudyLab.tsx`
- `09-PHASE9-HANDOFF.md`

The new Study Lab lets the creator save a lesson transcript, generate AI drafts, and approve/reject each generated Pattern, Vocabulary item, Insight, or Exercise. Approved content is copied into the existing canonical learning tables.

### Critical correction to the old roadmap

Do **not** implement the main classroom player as:

`Teacher sentence → forced pause → user recording → continue`

The real intended behavior is:

`Original classroom audio → continuous playback → user listens and repeats naturally`

The transcript and AI layer are used **after/around listening** to create deeper study material and consolidation.

### Current roadmap

**Phase 9 / 10 — COMPLETE**

Next:

**Phase 10 — Continuous Audio + Optional Active Practice**

Phase 10 may add optional sentence practice, voice recording, shadowing, and explicitly activated smart-pause drills. None of these may interrupt the default continuous classroom audio.

## Phase 10 Handoff
Completed the final planned product phase: continuous original classroom playback plus optional active speaking practice. The main audio path is intentionally not a drill engine. `lesson_listening_progress` stores resume position and completion state; the player saves periodically and on pause/end, and the Listen page subscribes to realtime progress changes. `OptionalSpeakingPractice` uses browser MediaRecorder only when the learner explicitly selects Record Yourself. Recordings upload to private Storage and create `voice_recordings` rows. No automatic pause, no forced recording, and no invented pronunciation score.

Latest archive: `mk-english-pro-phase10.zip`.
