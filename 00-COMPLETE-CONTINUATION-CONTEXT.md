# MK ENGLISH PRO — COMPLETE CONTINUATION CONTEXT
## سند مرجع برای AI / Developer بعدی

**آخرین وضعیت:** پایان Phase 6  
**تاریخ:** 2026-09-15  
**هدف این فایل:** اگر این پروژه را به یک AI دیگر، Claude، Cursor، Codex یا Developer دیگری می‌دهید، این فایل باید اولین چیزی باشد که می‌خواند. این سند توضیح می‌دهد پروژه چیست، چه تصمیماتی گرفته شده، چه چیزهایی در کد/دیتابیس موجود است، چه چیزهایی فقط طراحی شده، و دقیقاً ادامه‌ی کار از کجا باید باشد.

---

# 1. پروژه چیست؟

**MK English Pro** یک PWA شخصی برای یادگیری انگلیسی است که حول روش کلاس واقعی کاربر ساخته می‌شود.

هسته‌ی آموزشی:

> استاد یک جمله/معنی فارسی می‌گوید → زبان‌آموز باید سریع جمله‌ی انگلیسی را بسازد → ساختار ثابت می‌ماند و واژه/شرایط عوض می‌شود → این فرایند به شکل Call & Response / Substitution Drill ادامه پیدا می‌کند.

کاربر باید بتواند فایل صوتی واقعی کلاس را **همان‌طور که هست و بدون Stop/Play دستی** گوش کند و هم‌زمان پاسخ بدهد.

اصل مهم UX:

- فایل صوتی کلاس نباید برای تمرین به تکه‌های جداگانه‌ای تبدیل شود که کاربر مجبور باشد بعد از هر جمله Stop کند.
- کاربر باید بتواند مثل حضور در کلاس، صدا را پیوسته پخش کند و بلافاصله جمله را بسازد.
- محتوای متنی/تمرینی AI نقش مکمل دارد: بعد از شنیدن فایل، متن جلسه به Grammar، Pattern، Vocabulary، Exercise، Insight و Practice تبدیل می‌شود.
- بنابراین Audio تجربه‌ی «کلاس» است؛ متن و AI تجربه‌ی «تثبیت و تمرین» هستند.

---

# 2. ایده‌ی مهم AI

AI هر جلسه باید **بر اساس همان جلسه** ساخته شود.

مثلاً اگر Session 12 شامل این‌ها باشد:

- Present Perfect
- Pattern خاص X
- Vocabulary خاص
- چند نکته‌ی ضمنی

AI Coach در همان Session باید این دانش را مبنا قرار دهد.

AI Coach باید بتواند:

1. جمله بدهد و از کاربر بخواهد آن را بسازد.
2. مکالمه‌ی طبیعی انجام دهد.
3. به شکل Loop وار تمرین را ادامه دهد.
4. اشتباه را کوتاه اصلاح کند.
5. بلافاصله تمرین/سؤال بعدی را بدهد.
6. بیشتر روی Grammar/Patternهای ضعیف‌تر کار کند.
7. گاهی مطالب قدیمیِ ضعیف را هم طبیعی وارد مکالمه کند.

فعلاً **Text Chat با AI قابل قبول است** و Voice Chat فعلاً جزو نیاز فوری نیست.

---

# 3. معماری اصلی

ساختار محتوایی:

`Package → Level → Season → Chapter → Lesson → Pattern → Drill Item`

ورودی هر Lesson:

- PDF جلسه
- Audio جلسه

PDF منبع رسمی‌تر ساختار درس است.
Audio برای نکات ضمنی، مثال‌ها و اطلاعاتی که در PDF نیست استفاده می‌شود.

---

# 4. تکنولوژی

- React
- Vite
- TypeScript
- Tailwind
- PWA / vite-plugin-pwa
- Supabase
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions
- Deno در Edge Functions

برای یک کاربر شخصی ساخته می‌شود، اما Auth و `user_id` عمداً حفظ شده‌اند تا Sync بین چند دستگاه امن باشد.

---

# 5. تصمیمات قطعی و غیرقابل تغییر مگر با دلیل

## Audio

Audio از Google Drive به Supabase Storage کپی می‌شود، نه اینکه مستقیماً از Google Drive پخش شود.

دلیل:
- Range Requests
- Offline caching
- پایداری
- محدودیت دانلود Google Drive

Edge Function مسئول Import است.

## Storage

همه Storage bucketها Private هستند.

هر فایل باید از Signed URL پخش/دریافت شود.

مسیر فایل‌ها:

`{user_id}/{lesson_id}/{filename}`

`service_role` هرگز نباید وارد Frontend شود.

## Security

همه‌ی جدول‌ها `user_id` دارند.

RLS باید فعال باشد.

Policy پایه:

`auth.uid() = user_id`

## UI

تم بصری:

- Ink Navy
- Parchment
- Amber
- Teal

حس کلی: «نوار کاست کلاس زبان»، نه SaaS مدرن معمولی.

فونت:
- Vazirmatn برای فارسی
- Fraunces برای تیترها

RTL برای UI فارسی و LTR ایزوله برای متن انگلیسی.

---

# 6. وضعیت موجود در Repository

## 01-architecture-docs/

### `MK_English_Pro_Architecture.md`
مرجع اصلی معماری پروژه است.

### `MK_English_Pro_AI_Architecture.txt`
سند اولیه AI است؛ نسخه‌ی فارسی معماری دقیق‌تر و مرجع اصلی است.

---

# 7. Database موجود

## `02-database/mk_english_pro_schema.sql`

اسکیما اصلی پروژه.

شامل حوزه‌های:

- Package / Level / Season / Chapter / Lesson
- Audio Sources
- Transcript Turns
- Patterns
- Drill Items
- Voice Recordings
- Vocabulary
- Extracted Insights
- Notes
- Lesson Progress
- Pattern Mastery
- Reviews
- User Stats
- Achievements
- Daily Challenges

RLS فعال است.

## `mk_english_pro_storage.sql`

Bucketهای اصلی:

- `lesson-audio`
- `lesson-pdfs`
- `vocab-audio`
- `voice-recordings`

Private هستند.

---

# 8. Edge Function موجود

## `03-edge-functions/import-drive-audio/index.ts`

مسئول Import کردن Audio از Google Drive است.

کارهایی که انجام می‌دهد:

1. JWT کاربر را بررسی می‌کند.
2. File ID را از چند فرمت Google Drive URL استخراج می‌کند.
3. فایل را دانلود می‌کند.
4. حالت Google Drive virus-scan confirmation را برای فایل‌های بزرگ هندل می‌کند.
5. فایل را در Storage قرار می‌دهد.
6. `audio_sources` را update می‌کند.
7. `status = ready` یا `error` ثبت می‌کند.

**وضعیت مهم:** این Function در زمان تهیه‌ی این handoff هنوز Deploy و تست واقعی نشده است.

---

# 9. PWA موجود

مسیر:

`04-pwa-app/`

صفحات فعلی:

- Home
- Learn
- Listen
- Practice
- Profile
- LessonDetail

`BottomNav` دارای 5 بخش اصلی است.

`LessonDetail` برای نمایش:
- Pattern
- Vocabulary
- Hidden Insights

در نظر گرفته شده.

---

# 10. Phase 4 — AI Content Generation

هدف Phase 4:

`Transcript → AI Extraction → Draft → Human Review → Canonical Content`

AI نباید مستقیماً محتوای اصلی را تغییر دهد.

ابتدا Draft تولید می‌شود.

Creator / Human آن را بررسی می‌کند.

سپس فقط آیتم تأییدشده وارد محتوای اصلی می‌شود.

انواع خروجی:

- Grammar
- Pattern
- Vocabulary
- Exercise
- Learning Insight

هر extraction باید تا حد امکان به Transcript و `source_turn_ids` قابل ردیابی باشد.

این اصل بسیار مهم است:

> AI تولیدکننده‌ی Draft است، نه صاحب حقیقت دیتابیس.

---

# 11. Phase 5 — Cross-Session Learning & Mastery

ایده:

اپ نباید فقط بداند «در این جلسه چه چیزهایی یاد گرفته شد».

باید بداند:

- این Grammar قبلاً چند بار دیده شده؟
- این Pattern چند بار تمرین شده؟
- چند بار درست Recall شده؟
- چند بار اشتباه شده؟
- Mastery چقدر است؟
- آخرین تمرین چه زمانی بوده؟
- چه چیزی Weak Point است؟

جدول اضافه‌شده/طراحی‌شده:

`learner_mastery`

فیلدهای اصلی:

- user_id
- entity_type
- entity_id
- mastery_score
- exposure_count
- successful_recall_count
- failed_recall_count
- last_practiced_at
- next_review_at
- last_session_id

Entity Type:

- grammar
- pattern
- vocabulary
- insight

RPC اصلی:

`record_learning_event()`

RPC دیگر:

`get_learning_context()`

AI Coach باید از این Context استفاده کند.

---

# 12. رفتار AI Coach بعد از Phase 5

AI Coach نباید فقط از Context همان Session استفاده کند.

باید ترکیبی از این‌ها را ببیند:

### Current Lesson Context
- Lesson
- Grammar
- Pattern
- Vocabulary
- Insights

### Cross-Session Context
- Weak Points
- Mastery
- Exposure
- Failed Recall
- Review status

اولویت:

1. Current Lesson
2. Current Lesson weak items
3. Older weak items در صورت مناسب بودن

AI نباید بدون دلیل تبدیل به مدرس گرامر شود.

مکالمه باید طبیعی بماند.

---

# 13. Phase 6 — Practice → Mastery → Review

هدف:

`Practice Attempt → Mastery Update → Review Queue → دوباره Practice`

جدول:

`review_queue`

فیلدهای اصلی:

- user_id
- entity_type
- entity_id
- lesson_id
- reason
- due_at
- priority
- completed_at

RPCها:

### `record_learning_event()`

هر Practice واقعی باید آن را صدا بزند.

### `get_due_reviews()`

آیتم‌های Due را بر اساس Priority و Due Date برمی‌گرداند.

### `complete_review_item()`

Review را بعد از انجام واقعی complete می‌کند.

---

# 14. الگوریتم فعلی Review

این الگوریتم MVP است و عمداً ساده نگه داشته شده.

اگر پاسخ اشتباه باشد:

- حدود 1 روز بعد Review

اگر پاسخ درست باشد، فاصله با توجه به Mastery افزایش می‌یابد.

تقریب فعلی:

- Weak → 1 day
- Developing → 3 days
- Solid → 7 days
- Strong → 21 days

این الگوریتم بعداً می‌تواند با FSRS یا SM-2 جایگزین شود.

نباید معماری UI/Database را به الگوریتم فعلی گره زد.

---

# 15. فایل‌های Phase 6

در ادامه‌ی کار این فایل‌ها باید در پروژه موجود باشند:

### Database

`02-database/06_phase6_practice_mastery_review.sql`

### PWA SQL copy

`04-pwa-app/supabase/sql/06_phase6_practice_mastery_review.sql`

### Review API

`04-pwa-app/src/lib/review.ts`

### Practice → Mastery helper

`04-pwa-app/src/lib/practiceMastery.ts`

### Review page

`04-pwa-app/src/pages/Review.tsx`

---

# 16. مهم‌ترین کار باقی‌مانده

**Phase 6 از نظر مدل داده آماده شده، اما هنوز باید به UI واقعی Practice متصل شود.**

یعنی الان نباید فقط یک helper داشته باشیم.

وقتی کاربر در Practice جواب می‌دهد:

1. جواب بررسی شود.
2. نتیجه‌ی درست/غلط مشخص شود.
3. Practice Attempt در دیتابیس ذخیره شود.
4. Entityهای مرتبط پیدا شوند.
5. `record_learning_event()` برای آن‌ها اجرا شود.
6. Mastery تغییر کند.
7. `next_review_at` محاسبه شود.
8. Review Queue update شود.

این مهم‌ترین قدم بعدی است.

---

# 17. Review باید واقعاً Practice باشد

صفحه‌ی Review نباید فقط یک Checklist باشد.

کار درست:

`Review Item → Resolve Entity → Generate/Open Exercise → User Answers → Result → Mastery Update → Complete/Reschedule`

مثلاً اگر Review مربوط به یک Pattern است:

- Pattern را پیدا کن.
- یک تمرین مناسب همان Pattern باز کن.
- کاربر پاسخ بدهد.
- نتیجه ثبت شود.
- بر اساس نتیجه Review دوباره زمان‌بندی شود.

دکمه‌ی «انجام شد» بدون Attempt واقعی نباید رفتار اصلی باشد.

---

# 18. ارتباط Grammar با Lesson

اگر یک Grammar در چند Lesson استفاده شده، باید Referenceها حفظ شوند.

یعنی:

`Lesson A → Grammar X`

`Lesson B → Grammar X`

`Lesson C → Grammar X`

ولی:

`Mastery(Grammar X, User)`

یک Mastery مشترک بین Sessionهاست.

در نتیجه سیستم می‌تواند بگوید:

> Grammar X را در سه جلسه دیده‌ای، اما Recall تو هنوز ضعیف است.

این دقیقاً همان Cross-Session Learning است.

---

# 19. ارتباط Pattern با Session

Pattern می‌تواند متعلق به یک Lesson باشد، ولی Mastery آن می‌تواند در طول زمان دنبال شود.

AI Coach باید بتواند:

- Pattern فعلی را تمرین کند.
- Patternهای قدیمی را اگر Weak هستند برگرداند.
- از تکرار خشک جلوگیری کند.

---

# 20. Audio UX — نکته‌ی حیاتی

این پروژه نباید Audio Player معمولی باشد که کاربر دائم Pause کند.

هدف:

**Continuous Classroom Playback**

کاربر:

1. Play می‌کند.
2. Audio ادامه پیدا می‌کند.
3. استاد جمله می‌گوید.
4. کاربر بلافاصله پاسخ می‌دهد.
5. Audio بدون نیاز به Stop دستی ادامه دارد.

اگر بعداً `drill_pause` یا Segmentation اضافه شد، آن باید یک قابلیت هوشمند/اختیاری باشد، نه اینکه تجربه‌ی اصلی را خراب کند.

---

# 21. AI Content Pipeline آینده

Pipeline پیشنهادی:

`Audio/PDF`
↓
`Transcript`
↓
`Turn Segmentation`
↓
`Grammar / Pattern / Vocabulary / Insight Extraction`
↓
`Draft`
↓
`Creator Review`
↓
`Canonical Content`
↓
`Practice Generation`
↓
`Mastery`
↓
`Review`
↓
`AI Coach`

---

# 22. Creator Mode

Creator Mode برای صاحب اپ است.

کارهای مورد انتظار:

- ساخت Lesson
- Upload PDF
- وارد کردن Google Drive Audio
- مشاهده Transcript
- اجرای AI Extraction
- مشاهده Draftها
- Approve
- Reject
- ویرایش Draft
- انتشار به Canonical Content

AI نباید بدون Review انسانی محتوای رسمی Lesson را overwrite کند.

---

# 23. چیزهایی که هنوز کامل نشده‌اند

## High Priority

1. اتصال واقعی Practice UI به `recordLearningEvent`.
2. Review Item → Exercise واقعی.
3. ذخیره‌ی واقعی Practice Attempts.
4. نمایش Mastery بعد از Attempt.
5. AI Coach استفاده از Due Reviewها.

## Medium Priority

6. Auth UI واقعی.
7. Creator Mode کامل.
8. Deploy و تست Edge Function.
9. Audio player واقعی.
10. Voice Recording.
11. Offline audio caching.
12. AI transcription pipeline.

## Later

13. Forced Alignment.
14. Pronunciation comparison.
15. Voice AI.
16. FSRS.
17. Gamification پیشرفته.
18. PWA icons واقعی.

---

# 24. چیزهایی که نباید دوباره طراحی شوند

AI/Developer بعدی نباید این‌ها را از صفر عوض کند مگر اینکه دلیل معماری جدی داشته باشد:

- Supabase
- Private Storage
- user_id + RLS
- Package → Level → Season → Chapter → Lesson
- Pattern محور بودن سیستم
- Audio به عنوان تجربه‌ی اصلی کلاس
- AI Draft → Human Approval
- Cross-Session Mastery
- Review Queue
- فارسی RTL + انگلیسی LTR
- Visual identity فعلی

---

# 25. ترتیب پیشنهادی ادامه

### Phase 7A
Practice واقعی را به Mastery وصل کن.

### Phase 7B
Review را به Exercise واقعی وصل کن.

### Phase 7C
AI Coach را به Due Reviews وصل کن.

### Phase 7D
Mastery Dashboard را به اطلاعات واقعی Practice متصل کن.

### Phase 8
Auth + Creator Mode + Audio Import را production-ready کن.

### Phase 9
Transcript/AI extraction pipeline.

### Phase 10
Continuous Audio Drill / optional smart pauses / voice recording.

---

# 26. Definition of Done برای حلقه‌ی یادگیری

این حلقه زمانی کامل است که بتوانیم این سناریو را end-to-end اجرا کنیم:

1. User وارد Lesson می‌شود.
2. Pattern را می‌بیند.
3. Practice را باز می‌کند.
4. پاسخ می‌دهد.
5. Attempt ذخیره می‌شود.
6. سیستم تشخیص می‌دهد Correct/Incorrect.
7. Mastery تغییر می‌کند.
8. Next Review محاسبه می‌شود.
9. Review Queue update می‌شود.
10. روز بعد آیتم Due ظاهر می‌شود.
11. User Review را باز می‌کند.
12. Exercise واقعی را انجام می‌دهد.
13. نتیجه دوباره روی Mastery اثر می‌گذارد.
14. AI Coach هم می‌تواند از همین Weak Point در مکالمه استفاده کند.

اگر این سناریو کار کند، Core Learning Loop محصول ساخته شده است.

---

# 27. وضعیت واقعی فایل‌ها در این Handoff

این archive شامل پایه‌ی پروژه‌ی موجود است:

- معماری
- Database اصلی
- Storage
- Edge Function
- PWA
- صفحات اصلی
- TypeScript types
- README
- Handoff Summary

همچنین این فایل (`00-COMPLETE-CONTINUATION-CONTEXT.md`) وضعیت Phaseهای 4 تا 6 و ادامه‌ی دقیق کار را ثبت می‌کند.

**نکته:** بعضی تغییرات Phase 4 تا 6 در مکالمه طراحی/ایجاد شده‌اند اما در archive اولیه‌ی موجود هنوز به‌صورت کامل merge نشده‌اند. بنابراین AI بعدی باید قبل از ادعای «کامل بودن implementation»، فایل‌های واقعی Repository را بررسی کند و Patchهای Phase 5/6 را در صورت نبودن اعمال کند.

---

# 28. دستور مستقیم به AI بعدی

اگر این فایل را می‌خوانی، از اول پروژه را بازطراحی نکن.

ابتدا:

1. فایل‌های موجود را inventory کن.
2. `00-HANDOFF-SUMMARY.md` و این فایل را بخوان.
3. `MK_English_Pro_Architecture.md` را به عنوان مرجع اصلی بخوان.
4. Database فعلی را با Phase 5/6 requirements مقایسه کن.
5. Practice UI فعلی را بررسی کن.
6. Review flow را بررسی کن.
7. فقط سپس implementation را ادامه بده.

**اولین هدف:** تکمیل `Practice Attempt → Mastery → Review Queue` به صورت واقعی و end-to-end.


---

# 14. Phase 7D — Mastery Dashboard (COMPLETED)

Phase 7D is now complete. The current repository includes a real `/mastery` dashboard that reads the existing learning state from Supabase rather than creating a second mastery model.

The dashboard reads `learner_mastery`, `patterns`, `practice_attempts`, and the existing `get_due_reviews()` RPC. It exposes overall mastery, mastery bands, due reviews, recent recall activity/accuracy, filters for attention/due items, and per-pattern recall/exposure information. Profile links to the dashboard, and the dashboard links back to Review and AI Coach.

The learning loop is now visible end-to-end:

`Lesson → Practice → Attempt → Mastery → Review Queue → Review Exercise → Attempt → Mastery`

AI Coach consumes the same state, and the Mastery Dashboard visualizes it.

**Current roadmap position: Phase 7D complete, 7 / 10 milestones.**

**Next phase: Phase 8 — Auth + Creator Mode + Audio Import production-ready.**

For exact Phase 7D implementation details, read `07-PHASE7D-HANDOFF.md`.


---

## Phase 8 continuation

Phase 8 is complete. Read `08-PHASE8-HANDOFF.md` for the exact implementation state and next step. The next milestone is **Phase 9 — Transcript + AI Extraction**.

# Phase 9 — Transcript Intelligence & Study Material Generation

Phase 9 is complete at repository level.

## Product rule

The original classroom audio is the authentic continuous experience. It must not be forced to stop after each sentence. The transcript/AI system is a separate consolidation layer.

## Added

- `lesson_transcripts`
- `ai_content_drafts`
- `transcript_ai` pattern source
- `ai-study-material` Edge Function
- Creator Study Lab at `/creator/lesson/:lessonId/study`
- AI Draft → Human Approval → Canonical Content flow

## Canonical publishing

Approved AI drafts can become:
- `patterns`
- `vocabulary`
- `extracted_insights`
- `drill_items`

Rejected drafts remain out of canonical lesson content.

## Not yet implemented

- automatic Speech-to-Text ingestion
- automatic PDF parsing
- voice recording
- pronunciation comparison
- forced alignment
- default smart pauses

## Next phase

Phase 10 — Continuous Audio + Optional Active Practice.

Default Listen remains uninterrupted. Optional speaking/shadowing/smart-pause practice is a separate mode.

## Phase 10 Completion — Continuous Audio + Optional Active Practice
The product philosophy is now explicit in code: authentic classroom audio is a continuous experience. `ContinuousAudioPlayer` never inserts sentence-level pauses. Listening position is persisted in `lesson_listening_progress` and synced through Supabase Realtime. The lesson page exposes optional speaking practice separately; a learner chooses a Drill Item and can record a response without changing or interrupting the original audio flow. Voice recordings are stored privately under the user's folder and linked to `voice_recordings`. No AI pronunciation or grammar score is claimed yet.

Next work after Phase 10 is maintenance/production verification: run Supabase migrations, configure Storage/Auth, deploy Edge Functions, install dependencies, run `npm run build`, test on desktop + Android + iPhone, and verify Realtime/resume/recording permissions in the real Supabase project.
