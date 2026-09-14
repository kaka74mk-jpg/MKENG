# MK English Pro — سند معماری نهایی
### PWA + AI Language Learning System

---

## ROLE

طراحی و ساخت به‌عنوان تیمی متشکل از:
- Full Stack Developer
- PWA Architect
- UI/UX Designer
- Database Architect
- AI Product Designer

ساخت از صفر، بدون استفاده از کد قبلی. یک Progressive Web Application کامل.

---

## PRODUCT VISION

MK English Pro یک سیستم شخصی یادگیری زبان انگلیسی مبتنی بر هوش مصنوعیه که مهارت‌های زیر رو تقویت می‌کنه:

- Listening
- Speaking
- Vocabulary
- Pronunciation
- Grammar
- Conversation

محتوای پایه‌ی اپ، کلاس‌های صوتی واقعی با روش **Substitution Drill (Call & Response)** است:
استاد یک جمله‌ی فارسی می‌گوید، شاگردان کلاس سریع معادل انگلیسی را با یک ساختار گرامری
ثابت می‌گویند، و استاد جمله‌ی بعدی را با همان الگو و جایگزینی واژه ادامه می‌دهد.
کاربر اپ در نقش «شاگرد چهارم» قرار می‌گیرد و هم‌زمان با کلاس تمرین می‌کند.

---

## PLATFORM REQUIREMENT

MK English Pro باید به‌صورت Progressive Web Application (PWA) توسعه یابد — **نه** اپلیکیشن نیتیو.
تجربه‌ی اصلی باید برای گوشی هوشمند طراحی شود.

اپلیکیشن باید:
- روی صفحه‌ی اصلی گوشی نصب شود
- مثل یک اپ موبایل واقعی رفتار کند
- روی مرورگر اندروید و آیفون کار کند
- از حالت آفلاین پشتیبانی کند
- رابط کاربری لمسی و موبایل‌فرست داشته باشد

نباید حس یک وب‌سایت معمولی بدهد.

---

## DESIGN STYLE

طراحی رابط کاربری پریمیوم و مبتنی بر موبایل، با الهام از: Duolingo، Memrise، Busuu، LingQ.

الزامات:
- Mobile-first design
- دکمه‌ها و المان‌های لمسی بزرگ
- کارت‌های گردشده
- انیمیشن‌های نرم
- ناوبری ساده
- بدون فیچرهای غیرضروری

---

## LEARNING STRUCTURE

سلسله‌مراتب محتوا:

```
Package → Level → Season → Chapter → Lesson → Pattern → Drill Item
```

- **Package**: مجموعه‌ای که کاربر دریافت کرده و شامل چند سطح است.
- **Pattern**: ساختار گرامری ثابتی که در بخشی از درس تمرین می‌شود
  (مثال: «Subject + has gone to + destination»).
- **Drill Item**: هر تکرار از الگو با جایگزینی واژه؛ شامل جفت جمله‌ی فارسی/انگلیسی
  و بازه‌ی زمانی متناظر در فایل صوتی.

### LEVEL SYSTEM

- A1 Beginner
- A2 Elementary
- B1 Intermediate
- B2 Upper Intermediate
- C1 Advanced

### LESSON FLOW

هر درس شامل:
- Audio
- Transcript
- Pattern(های) گرامری و Drill Itemهای مربوطه
- Vocabulary
- Phrases
- Grammar
- نکات ضمنی استخراج‌شده (Extracted Insights)
- Practice (Drill + Quiz)
- Review

### PROGRESSION SYSTEM

یادگیری باید گام‌به‌گام باشد؛ محتوای جدید فقط بعد از تکمیل محتوای قبلی باز می‌شود:

```
Lesson 1: Completed → Lesson 2: Available → Lesson 3: Locked
```

---

## منابع محتوای درس: PDF + صدا (Hybrid Content Pipeline)

محتوای هر جلسه از دو منبع تغذیه می‌شود که مکمل هم هستند، نه جایگزین:

1. **PDF جلسه** (تهیه‌شده توسط تیم محتوا): منبع اصلیِ ساختار رسمی درس —
   Pattern گرامری، لیست واژگان رسمی، مثال‌های تمیز و بدون خطا.
2. **فایل صوتی کلاس**: منبع تلفظ، ریتم واقعی گفتار، صدای شاگردان برای مقایسه،
   و مهم‌تر از همه، محتوای ضمنی و بداهه‌ای که فقط در گفتار زنده وجود دارد.

### جریان پردازش

```
PDF → Parse ساختار رسمی (Pattern + Vocabulary + Grammar)
   → Forced Alignment با فایل صوتی (پیدا کردن Timestamp دقیق هر جمله در صدا)
   → لایه‌ی دوم AI: تحلیل فقط بخش‌های توضیح آزاد صدا برای نکات ضمنی
```

دلیل این ترتیب:
- ساختار رسمی از PDF گرفته می‌شود چون از قبل توسط انسان مرتب و بدون خطاست؛
  حدس‌زدن Pattern از روی صدای نویزدار ریسک خطا و هالوسینیشن AI را بالا می‌برد.
- Forced Alignment جمله‌های PDF را به لحظه‌ی دقیق در صدا وصل می‌کند، بدون نیاز
  به بازتشخیص از صفر.
- تحلیل AI روی صدا فقط برای چیزی به‌کار می‌رود که در PDF نیست: توضیح‌های
  شفاهی، اصطلاحات بداهه، تصحیح تلفظ.

اگر برای برخی جلسات PDF موجود نباشد، سیستم باید بتواند به‌صورت Fallback از روی
خودِ صدا Pattern و Vocabulary را استخراج کند (طبق فرآیند بخش بعد)، اما در همه‌ی
حالت‌ها اولویت با PDF است.

---

## AUDIO SYSTEM

پشتیبانی از:
- آپلود فایل صوتی
- افزودن صدا از طریق لینک Google Drive
- منابع صوتی خارجی

فرمت‌های پشتیبانی‌شده: MP3, WAV, M4A, OGG

### GOOGLE DRIVE AUDIO

- اعتبارسنجی لینک
- بررسی دسترسی
- ذخیره‌ی نوع منبع
- پخش صدا
- مدیریت خطا با پیام‌های کاربرپسند

---

## AI AUDIO PROCESSING — تقطیع نوبت گفتار (Turn Segmentation)

```
Audio → Speaker Diarization → Language Detection → Turn Classification → Pattern Extraction
```

1. **Speaker Diarization**: تشخیص صدای استاد در برابر شاگردان.
2. **Language Detection**: تفکیک بخش فارسی (prompt) از بخش انگلیسی (response).
3. **Turn Classification**: برچسب‌گذاری هر بخش:
   - `drill_prompt` (جمله‌ی فارسی استاد)
   - `drill_pause` (سکوت / فرصت پاسخ)
   - `drill_response` (پاسخ شاگردان ضبط‌شده)
   - `teacher_explanation` (توضیح آزاد)
   - `incidental_note` (نکته‌ی جانبی گرامری یا لغوی)
4. **Pattern Extraction**: گروه‌بندی توالی‌های `drill_prompt + drill_pause + drill_response`
   با ساختار مشترک، به‌عنوان یک Pattern با چند Drill Item (در صورت نبود PDF متناظر).

تشخیص `drill_pause` می‌تواند خودکار (تشخیص سکوت طولانی‌تر از یک آستانه‌ی زمانی)
یا دستی توسط Creator (علامت‌گذاری روی waveform) باشد. پیشنهاد: تشخیص خودکار
به‌عنوان پیش‌نویس + امکان اصلاح دستی.

---

## TRANSCRIPT SYSTEM

ترنسکریپت باید کاملاً تعاملی باشد:
- همگام‌سازی متن با صدا
- هایلایت جمله‌ی در حال پخش
- کلیک روی جمله برای پخش مجدد
- توضیح جمله با AI
- ذخیره‌ی جملات
- افزودن یادداشت

---

## VOCABULARY AI SYSTEM

استخراج خودکار (از PDF در اولویت اول، از صدا در صورت نبود PDF):
- واژگان مهم
- اصطلاحات
- Phrasal verbs
- جملات کاربردی

هر آیتم واژگان شامل:
- Word
- Meaning
- Pronunciation
- Example
- Audio
- Level
- Category

### VOCABULARY REVIEW

- Flashcards
- Fill the blank
- Multiple choice
- Sentence creation
- AI correction

### SPACED REPETITION

برنامه‌ی مرور: فردا، ۳ روز بعد، ۷ روز بعد، ۳۰ روز بعد — تطبیق‌یابنده بر اساس عملکرد کاربر.

---

## نکات ضمنی — Extracted Insights

هر چیزی که استاد لابه‌لای توضیح آزاد (`teacher_explanation` / `incidental_note`) می‌گوید —
اصطلاح، نکته‌ی گرامری غیررسمی، تصحیح تلفظ، مثال بداهه — جدا استخراج و با
**توضیح کامل‌تر از حد معمول** (چون از دل جمله‌ای ناقص بیرون آمده) ارائه می‌شود.

هر آیتم شامل:
- عبارت/لغت/نکته‌ی استخراج‌شده (raw snippet)
- توضیح کامل تولیدشده توسط AI
- حداقل یک مثال اضافه
- سطح تخمینی + پرچم «بالاتر/پایین‌تر از سطح درس»
- دسته‌بندی: لغت / اصطلاح / نکته‌ی گرامری / تلفظ
- Timestamp دقیق برای پرش به همان لحظه از صدا

### نمایش در UI

تب/کارت جداگانه در صفحه‌ی درس به نام **«نکات پنهان این درس»**، مجزا از Vocabulary
رسمی. با تپ روی هر آیتم، پخش صدا مستقیم به همان لحظه می‌پرد.

---

## AI FEATURES

استفاده از AI برای:
- توضیح جملات
- توضیح گرامر
- ساخت تمرین
- ساخت کوییز
- تمرین مکالمه
- تصحیح خطا

### AI CONVERSATION — دو زیرحالت

| حالت | توضیح |
|---|---|
| **Drill Mode** | AI نقش استاد را بازی می‌کند و با همان Pattern درس، جملات تازه می‌سازد و فرصت پاسخ می‌دهد (ساختاریافته و محدود) |
| **Free Conversation Mode** | مکالمه‌ی آزاد متنی یا صوتی، با اصلاح خطا و پیشنهاد جمله‌ی بهتر |

AI باید:
- طبیعی پاسخ دهد
- خطاها را اصلاح کند
- جمله‌ی بهتر پیشنهاد دهد
- نقاط ضعف کاربر را پیگیری کند

---

## DRILL PRACTICE — تجربه‌ی «شاگرد چهارم»

هسته‌ی اصلی تمرین اپ، نه یک فیچر جانبی:

```
پخش drill_prompt (فارسی) → توقف خودکار در drill_pause
→ ضبط صدای کاربر → پخش drill_response (۳ شاگرد اصلی، برای مقایسه)
→ AI امتیاز می‌دهد (گرامر + تلفظ) → Drill Item بعدی
```

ویژگی‌ها:
- توقف خودکار پخش دقیقاً در لحظه‌ی شروع مکث
- ضبط صدای کاربر در همان بازه (با محدودیت زمانی قابل‌تنظیم)
- پخش خودکار پاسخ اصلی بعد از ضبط، برای مقایسه
- امتیازدهی دوبعدی: صحت گرامری/واژگانی + تلفظ
- «حالت سریع» بدون توقف، فقط شنیدن و همراهی (Shadowing واقعی)

### SHADOWING MODE

```
Listen → Pause → Repeat → Compare → Continue
```

### VOICE RECORDING

- ضبط صدا
- مقایسه با نسخه‌ی اصلی
- ذخیره‌ی تلاش‌ها

---

## PROGRESS SYSTEM

معیار پیشرفت محور Pattern است، نه فقط واژگان:

- تعداد Patternهای تسلط‌یافته (mastery)
- درصد پاسخ صحیح در بازه‌ی مکث (grammar accuracy)
- روند امتیاز تلفظ در طول زمان
- سرعت واکنش (reaction latency) — شاخص مهم در این روش آموزشی
- زمان Listening
- تعداد نکات ضمنی مرورشده
- تعداد درس‌های تکمیل‌شده

---

## GAMIFICATION

- XP
- Levels
- Streaks
- چالش‌های روزانه
- دستاوردها (Achievements)

---

## OFFLINE PWA FEATURES

- Service Worker
- درس‌های آفلاین
- کش صدا
- پیشرفت آفلاین
- همگام‌سازی بعد از اتصال مجدد

---

## MAIN PAGES

ناوبری پایین صفحه:
- Home
- Learn
- Listen
- Practice
- Profile

---

## CREATOR MODE

سازنده‌ی محتوا می‌تواند:
- سطح، فصل، چپتر و درس بسازد
- صدا یا لینک Google Drive اضافه کند
- فایل PDF جلسه را آپلود کند
- پیش‌نویس خودکار Turn Segmentation و Forced Alignment را ببیند و اصلاح کند
- روی waveform بازه‌های `drill_prompt` / `drill_pause` / `drill_response` را
  تأیید یا اصلاح کند
- Patternهای پیشنهادی (از PDF یا استخراج‌شده از صدا) را ویرایش/تأیید کند
- لیست `extracted_insights` پیشنهادی را قبل از انتشار بازبینی، ویرایش یا رد کند
- ترنسکریپت، واژگان و کوییز تولید کند

---

## DATABASE (Supabase)

جدول‌های اصلی:

**ساختار محتوا**: Packages, Levels, Seasons, Chapters, Lessons

**Drill**:
- `patterns` (id, lesson_id, grammar_structure_fa, grammar_structure_en, example_fa, example_en, level, order_index)
- `drill_items` (id, pattern_id, sentence_fa, sentence_en, audio_prompt_start/end, audio_pause_start/end, audio_response_start/end, order_index)

**محتوای صوتی و متنی**: Audio sources, Transcripts

**واژگان و نکات**:
- `vocabulary`
- `extracted_insights` (id, lesson_id, source_turn_timestamp, category, raw_snippet, ai_expanded_explanation, ai_example, estimated_level, level_flag)

**کاربر**: Users, Progress, Notes, Reviews

---

## REALTIME SYNC

پشتیبانی از چند دستگاه هم‌زمان. تغییرات باید خودکار نمایش داده شوند، بدون نیاز به رفرش دستی.

---

## SECURITY

کلیدهای API هوش مصنوعی هرگز نباید در فرانت‌اند قرار بگیرند.

معماری صحیح:

```
PWA → Backend → AI Services
```

---

## ERROR HANDLING

هرگز خطای فنی نمایش داده نشود؛ همیشه پیام‌های کاربرپسند.

---

## FINAL GOAL

ساخت MK English Pro به‌عنوان:

> «یک استاد انگلیسی پریمیوم مبتنی بر هوش مصنوعی، داخل گوشی، به‌صورت
> Progressive Web App، که تجربه‌ی واقعی حضور در کلاس صوتی Drill را
> برای کاربر به‌عنوان شاگرد چهارم بازسازی می‌کند.»

محصول نهایی باید:
- سریع
- زیبا
- موبایل‌فرست
- هوشمند
- ساده در استفاده
- آماده برای توسعه‌ی آینده

باشد.

---

## Phase 9 architectural clarification — Audio vs Study Intelligence

The authentic classroom audio is the primary listening experience and must play continuously as recorded. AI must not insert mandatory sentence pauses or response windows into the default audio player.

The transcript is a separate intelligence layer used to consolidate learning after/around listening. It can produce Patterns, Vocabulary, Insights, Reading/Comprehension material, Transformation Exercises, and Review candidates. AI output remains Draft until human review approves it as canonical lesson content.

The intended product pipeline is:

`Original Audio → Continuous Playback`

`Transcript + PDF → AI Analysis → Draft Study Material → Human Review → Canonical Content → Practice / Mastery / Review / AI Coach`

Optional active speaking, shadowing, recording, or smart-pause drills belong to a separate explicit practice mode in Phase 10.
