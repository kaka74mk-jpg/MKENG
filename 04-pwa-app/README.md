# MK English Pro

PWA شخصی برای تمرین انگلیسی با روش Substitution Drill — «شاگرد چهارم کلاس».

## راه‌اندازی

1. وابستگی‌ها را نصب کنید:

   ```bash
   npm install
   ```

2. فایل `.env.example` را کپی کنید و مقادیر Supabase خودتان را وارد کنید:

   ```bash
   cp .env.example .env
   ```

3. اجرا در حالت توسعه:

   ```bash
   npm run dev
   ```

4. ساخت نسخه‌ی نهایی (production build):

   ```bash
   npm run build
   npm run preview
   ```

## پیش‌نیاز پایگاه‌داده

قبل از اجرای اپ، دو اسکریپت SQL زیر را در Supabase SQL Editor اجرا کرده باشید (به ترتیب):

1. `mk_english_pro_schema.sql` — جدول‌ها، Enumها، و RLS
2. `mk_english_pro_storage.sql` — باکت‌های Storage و پالیسی‌هایشان

و Edge Function واقع در `supabase/functions/import-drive-audio` را deploy کرده باشید (برای Import صدا از Google Drive).

## آیکون‌های PWA

پوشه‌ی `public/icons/` باید شامل دو فایل باشد:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

اینها placeholder هستند — قبل از انتشار واقعی جایگزین‌شان کنید با آیکون طراحی‌شده‌ی خودتان.

## ساختار پروژه

```
src/
  lib/supabaseClient.ts   اتصال به Supabase (typed)
  types/database.ts       تایپ‌های جدول‌ها، منطبق با schema.sql
  components/BottomNav.tsx ناوبری پایین (۵ تب)
  pages/
    Home.tsx        استریک، XP، ادامه‌ی درس
    Learn.tsx        فهرست درس‌ها (مثل ترک‌های نوار کاست)
    Listen.tsx       شنیدن آزاد صوت‌های آماده
    Practice.tsx     ورودی به مرور/Drill/مکالمه‌ی آزاد
    Profile.tsx      حساب کاربری
    LessonDetail.tsx تب‌های الگو / واژگان / نکات پنهان یک درس
```

## نکات طراحی

پالت و تایپوگرافی در `tailwind.config.js` تعریف شده‌اند — الهام‌گرفته از حس «نوار کاست کلاس زبان»
(نه پالت‌های رایج SaaS). فونت فارسی: Vazirmatn، فونت تیتر: Fraunces.

## گام‌های بعدی که هنوز پیاده‌سازی نشده‌اند

- جریان Auth واقعی (صفحه‌ی ورود)
- پخش‌کننده‌ی صوتی با توقف خودکار روی `drill_pause` (هسته‌ی حالت Drill)
- ضبط صدای کاربر و آپلود به باکت `voice-recordings`
- Service Worker caching اختصاصی برای فایل‌های صوتی بزرگ (جدا از app shell)
- صفحه‌ی Creator Mode برای ساخت درس/آپلود PDF/Import از Drive

## Phase 8

- `/auth` — Supabase Magic Link authentication
- `AuthGuard` — session-protected application routes
- `/creator` — content hierarchy + Lesson creation
- Private PDF upload to `lesson-pdfs`
- Google Drive audio import through `import-drive-audio`
- Signed URL access for private lesson audio

Before production use, configure Supabase Auth Site URL / Redirect URLs and deploy the Edge Function.
