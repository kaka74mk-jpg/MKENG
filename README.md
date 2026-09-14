# MK English Pro

PWA شخصی برای تمرین انگلیسی با روش Substitution Drill — «شاگرد چهارم کلاس».

## ✅ در این نسخه اضافه شد

### فاز ۱ — Auth
- صفحه‌ی ورود با **Magic Link** (`src/pages/Login.tsx`) — بدون رمز عبور، فقط ایمیل.
- `App.tsx` حالا وضعیت ورود را چک می‌کند: تا لاگین نکرده باشید صفحه‌ی ورود نشان داده می‌شود،
  بعد از ورود مستقیم به اپ اصلی می‌روید.
- فایل `.env` با مشخصات پروژه‌ی Supabase شما از قبل پر شده.

### فاز ۲ — پخش‌کننده‌ی Drill (قلب اپ)
- `src/hooks/useSignedAudioUrl.ts` — گرفتن Signed URL موقت برای فایل‌های Storage خصوصی.
- `src/pages/DrillPicker.tsx` (روت `/practice/drill`) — فهرست الگوهایی که drill_item دارند.
- `src/pages/DrillSession.tsx` (روت `/practice/drill/:patternId`) — پخش‌کننده‌ی اصلی:
  صدای واقعی کلاس را از `audio_prompt_start` پخش می‌کند، سر `audio_prompt_end` خودش
  پاز می‌کند (نوبت کاربر)، با دکمه‌ی «پاسخ رو بشنو» بخش `audio_response_start..end`
  را پخش می‌کند و جمله‌ی انگلیسی را نشان می‌دهد، بعد به آیتم بعدی می‌رود.
- دکمه‌ی «حالت شاگرد چهارم» در `Practice.tsx` حالا به `/practice/drill` وصل است؛
  دو گزینه‌ی دیگر (مرور فاصله‌دار، مکالمه‌ی AI) فعلاً غیرفعال و برچسب «به‌زودی» دارند.

**توضیح کامل منطق و state machine داخل کامنت بالای `DrillSession.tsx` نوشته شده —
هر کسی که این فایل را باز کند بدون نیاز به این README هم متوجه می‌شود.**

### فاز ۳ — ضبط صدای کاربر
- `src/hooks/useVoiceRecorder.ts` — لایه‌ی نازک روی `MediaRecorder` مرورگر (شروع/توقف ضبط،
  برگرداندن Blob).
- در `DrillSession.tsx`: دکمه‌ی میکروفون در فاز «paused» اضافه شد. بعد از توقف ضبط،
  فایل خودکار در باکت `voice-recordings` آپلود و یک ردیف در جدول `voice_recordings`
  ثبت می‌شود (شامل `reaction_latency_ms` — فاصله‌ی زمانی از پاز شدن صدا تا زدن دکمه‌ی ضبط).
  ضبط کاملاً اختیاری است، مسیر اصلی Drill بدون آن هم کار می‌کند.
- `src/types/database.ts` — تایپ `VoiceRecording` و ردیف `voice_recordings` به `Database`
  اضافه شد.

**هنوز باقی مانده:** امتیازدهی خودکار (`grammar_score`, `pronunciation_score`) — بخشی
از پایپ‌لاین AI که هنوز طراحی نشده (آیتم ۶). فعلاً فقط ضبط و ذخیره انجام می‌شود، بدون
مقایسه یا نمره‌دهی.

## راه‌اندازی

1. وابستگی‌ها را نصب کنید:

   ```bash
   npm install
   ```

2. فایل `.env` از قبل با مشخصات پروژه‌ی Supabase شما پر شده است (`VITE_SUPABASE_URL` و
   `VITE_SUPABASE_ANON_KEY`). اگر پروژه‌ی Supabase عوض شد، همین فایل را ویرایش کنید
   (یا از `.env.example` یک نسخه‌ی جدید بسازید).

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

- Service Worker caching اختصاصی برای صدا (جدا از app shell، چون فایل‌های صوتی بزرگ‌اند)
- Service Worker caching اختصاصی برای فایل‌های صوتی بزرگ (جدا از app shell)
- صفحه‌ی Creator Mode برای ساخت درس/آپلود PDF/Import از Drive
