/**
 * DrillSession
 * ------------
 * این فایل قلب اصلی کل اپ است — همان چیزی که در سند معماری «شاگرد چهارم» نامیده
 * می‌شود. این‌جا توضیح می‌دهم دقیقاً چه اتفاقی می‌افتد تا اگر این کار نیمه‌کاره
 * ماند، هر کسی (یا هر هوش مصنوعی) بتواند دقیقاً از همین‌جا ادامه بدهد:
 *
 * ساختار داده (از schema.sql):
 *   pattern (یک قاعده‌ی گرامری) → چند drill_item (هر کدام یک جمله‌ی فارسی +
 *   معادل انگلیسی‌اش) → هر drill_item شش عدد timestamp دارد که به ثانیه در
 *   فایل صوتی اصلی درس اشاره می‌کند:
 *     audio_prompt_start / audio_prompt_end     → بخشی که استاد جمله‌ی فارسی را می‌گوید
 *     audio_pause_start   / audio_pause_end      → سکوت/مکثی که شاگردهای واقعی جواب می‌دهند
 *                                                   (در اپ از این بازه فقط برای اطلاع استفاده
 *                                                   می‌کنیم؛ عملاً اپ همین‌جا صدا را پاز می‌کند
 *                                                   و صبر می‌کند تا *کاربر* آماده شود، نه صرفاً
 *                                                   به‌اندازه‌ی مکث واقعی کلاس)
 *     audio_response_start/ audio_response_end   → جایی که پاسخ درست واقعی (استاد یا شاگرد
 *                                                   اول) گفته می‌شود — معیار مقایسه
 *
 *   صدای اصلی هر drill_item از طریق زنجیره‌ی pattern.lesson_id → audio_sources
 *   (با status='ready') پیدا می‌شود؛ یعنی همه‌ی drill_itemهای یک الگو از یک
 *   فایل صوتی واحد (صدای کامل همان جلسه‌ی کلاس) بریده می‌شوند.
 *
 * جریان (state machine) این کامپوننت — متغیر phase:
 *   "loading"   → در حال گرفتن pattern / drill_items / audio_source / signed URL
 *   "prompt"    → صدا از audio_prompt_start در حال پخش تا audio_prompt_end
 *   "paused"    → صدا خودش را در audio_prompt_end متوقف کرده؛ نوبت کاربر است که
 *                 بلند جواب بدهد (اینجا هیچ چیز اتوماتیک پخش نمی‌شود — عمداً،
 *                 چون سرعت واقعی حرف زدن کاربر با زمان‌بندی کلاس واقعی یکی نیست)
 *   "answer"    → کاربر دکمه‌ی «پاسخ رو بشنو» را زده؛ صدا از audio_response_start
 *                 تا audio_response_end پخش شده و خودش متوقف شده
 *   "finished"  → آخرین drill_item هم تمام شده
 *
 * محدودیت‌های شناخته‌شده (برای فازهای بعدی):
 *   - امتیازدهی خودکار به تلفظ/گرامر (grammar_score, pronunciation_score) هنوز
 *     پیاده نشده — نیاز به پایپ‌لاین AI دارد (آیتم ۶ در HANDOFF-SUMMARY).
 *   - فایل صوتی با <audio> استاندارد HTML5 پخش می‌شود، نه Web Audio API.
 *
 * فاز ۳ (این نسخه) — ضبط صدای کاربر:
 *   در فاز "paused" یک دکمه‌ی میکروفون اضافه شده. کاربر می‌تواند صدای خودش را
 *   ضبط کند (با useVoiceRecorder، مبتنی بر MediaRecorder مرورگر)، که بعد از
 *   توقف ضبط، خودکار در باکت voice-recordings آپلود و یک ردیف در جدول
 *   voice_recordings ثبت می‌شود (مسیر: {user_id}/{drill_item_id}/{timestamp}.webm،
 *   طبق قرارداد مسیر در mk_english_pro_storage.sql). reaction_latency_ms هم از
 *   فاصله‌ی زمانی «صدا پاز شد» تا «کاربر دکمه‌ی ضبط را زد» محاسبه می‌شود.
 *   ضبط کاملاً اختیاری است — کاربر می‌تواند بدون ضبط هم مستقیم «پاسخ رو بشنو»
 *   را بزند و ادامه بدهد.
 *
 * مسیر (route): /practice/drill/:patternId — در src/App.tsx ثبت شده.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSignedAudioUrl } from "../hooks/useSignedAudioUrl";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import type { DrillItem, Pattern } from "../types/database";

type Phase = "loading" | "prompt" | "paused" | "answer" | "finished" | "error";

const EPSILON = 0.15; // تلورانس ثانیه برای جلوگیری از overshoot موقع pause خودکار

/**
 * ست‌کردن currentTime قبل از لود شدن متادیتای صدا در بعضی مرورگرها نادیده گرفته
 * می‌شود. این تابع اگر audio هنوز آماده نباشد (readyState < 1) صبر می‌کند تا
 * رویداد loadedmetadata فایر شود، بعد seek و play را انجام می‌دهد.
 */
function seekAndPlay(audio: HTMLAudioElement, time: number) {
  const doSeek = () => {
    audio.currentTime = time;
    audio.play().catch(() => {
      /* اگر مرورگر autoplay را رد کند، کاربر خودش دکمه‌ی پخش را می‌زند */
    });
  };
  if (audio.readyState >= 1) {
    doSeek();
  } else {
    audio.addEventListener("loadedmetadata", doSeek, { once: true });
  }
}

export default function DrillSession() {
  const { patternId } = useParams();

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [items, setItems] = useState<DrillItem[]>([]);
  const [audioStoragePath, setAudioStoragePath] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [revealText, setRevealText] = useState(false);

  // ---- فاز ۳: وضعیت ضبط صدای کاربر ----
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const { recording, error: recordError, start: startRecording, stop: stopRecording } =
    useVoiceRecorder();
  // لحظه‌ای که صدا وارد فاز "paused" شد — برای محاسبه‌ی reaction_latency_ms
  const pausedAtRef = useRef<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  // phase در closure های timeupdate بی‌درنگ آپدیت نمی‌شود؛ به همین دلیل یک نسخه‌ی
  // Ref هم نگه می‌داریم تا هندلر همیشه آخرین phase را ببیند.
  const phaseRef = useRef<Phase>("loading");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const currentItem = items[index] as DrillItem | undefined;
  const { url: audioUrl, loading: urlLoading, error: urlError } = useSignedAudioUrl(audioStoragePath);

  // ---- گام ۱: گرفتن Pattern + Drill Items + مسیر فایل صوتی مربوط به درس ----
  useEffect(() => {
    if (!patternId) return;

    async function load() {
      const { data: patternRow, error: patternError } = await supabase
        .from("patterns")
        .select("*")
        .eq("id", patternId)
        .single();

      if (patternError || !patternRow) {
        setErrorMsg("این الگو پیدا نشد.");
        setPhase("error");
        return;
      }
      setPattern(patternRow);

      const { data: itemRows } = await supabase
        .from("drill_items")
        .select("*")
        .eq("pattern_id", patternId)
        .order("order_index", { ascending: true });
      setItems(itemRows ?? []);

      const { data: audioRow } = await supabase
        .from("audio_sources")
        .select("storage_path")
        .eq("lesson_id", patternRow.lesson_id)
        .eq("status", "ready")
        .limit(1)
        .maybeSingle();

      if (!audioRow?.storage_path) {
        setErrorMsg("فایل صوتی آماده‌ای برای این درس پیدا نشد.");
        setPhase("error");
        return;
      }
      setAudioStoragePath(audioRow.storage_path);
    }

    load();
  }, [patternId]);

  // ---- گام ۲: وقتی صدا و آیتم‌ها آماده شدند، پخش جمله‌ی اول را شروع کن ----
  useEffect(() => {
    if (audioUrl && items.length > 0 && phase === "loading") {
      playSegment("prompt");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, items.length]);

  function playSegment(target: "prompt" | "answer") {
    const audio = audioRef.current;
    const item = items[index];
    if (!audio || !item) return;

    const start = target === "prompt" ? item.audio_prompt_start : item.audio_response_start;
    if (start == null) {
      // این آیتم زمان‌بندی صوتی ندارد — مستقیم برو به فاز بعدی تا کاربر گیر نکند
      const nextPhase = target === "prompt" ? "paused" : "answer";
      if (nextPhase === "paused") pausedAtRef.current = Date.now();
      setPhase(nextPhase);
      return;
    }

    seekAndPlay(audio, start);
    setPhase(target === "prompt" ? "prompt" : "answer");
    setRevealText(false);
    if (target === "prompt") setSaveStatus("idle");
  }

  // ---- گام ۳: در حین پخش، مرز پایان بخش جاری را چک کن و خودکار پاز کن ----
  function handleTimeUpdate() {
    const audio = audioRef.current;
    const item = items[index];
    if (!audio || !item) return;

    if (phaseRef.current === "prompt" && item.audio_prompt_end != null) {
      if (audio.currentTime >= item.audio_prompt_end - EPSILON) {
        audio.pause();
        pausedAtRef.current = Date.now();
        setPhase("paused");
      }
    } else if (phaseRef.current === "answer" && item.audio_response_end != null) {
      if (audio.currentTime >= item.audio_response_end - EPSILON) {
        audio.pause();
        setRevealText(true);
      }
    }
  }

  // ---- فاز ۳: شروع/توقف ضبط صدای کاربر و آپلود به Storage ----
  async function handleRecordToggle() {
    if (recording) {
      const blob = await stopRecording();
      if (blob && currentItem) {
        void saveRecording(blob, currentItem.id);
      }
      return;
    }
    await startRecording();
  }

  async function saveRecording(blob: Blob, drillItemId: string) {
    setSaveStatus("saving");

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaveStatus("error");
      return;
    }

    const extension = blob.type.includes("mp4") ? "mp4" : "webm";
    const path = `${userId}/${drillItemId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("voice-recordings")
      .upload(path, blob, { contentType: blob.type || "audio/webm" });

    if (uploadError) {
      setSaveStatus("error");
      return;
    }

    const latency = pausedAtRef.current ? Date.now() - pausedAtRef.current : null;

    const { error: insertError } = await supabase.from("voice_recordings").insert({
      user_id: userId,
      drill_item_id: drillItemId,
      storage_path: path,
      reaction_latency_ms: latency,
    });

    setSaveStatus(insertError ? "error" : "saved");
  }

  function goToNext() {
    if (index + 1 >= items.length) {
      setPhase("finished");
      return;
    }
    setIndex((i) => i + 1);
    setPhase("loading");
    // پخش خودکار آیتم بعدی با کمی تأخیر تا state آپدیت شود
    setTimeout(() => playSegment("prompt"), 0);
  }

  const progressLabel = useMemo(
    () => (items.length ? `${index + 1} از ${items.length}` : ""),
    [index, items.length]
  );

  if (phase === "error") {
    return (
      <div className="px-5 pt-8">
        <p className="rounded-card bg-rust/10 px-5 py-4 text-center text-rust">{errorMsg}</p>
        <Link to="/practice/drill" className="mt-4 block text-center text-sm text-teal underline">
          بازگشت به فهرست الگوها
        </Link>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-5 text-center">
        <p className="font-display text-2xl text-parchment">تمرین این الگو تمام شد 🎉</p>
        <p className="mt-2 text-sm text-parchment/50">{items.length} جمله تمرین کردی.</p>
        <Link
          to="/practice/drill"
          className="mt-8 rounded-card bg-amber px-6 py-3 font-display text-ink"
        >
          انتخاب الگوی بعدی
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-5 pt-6">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={audioUrl ?? undefined} onTimeUpdate={handleTimeUpdate} />

      <div className="mb-6 flex items-center justify-between">
        <Link to="/practice/drill" className="text-sm text-parchment/40">
          ← بازگشت
        </Link>
        <span className="text-xs text-parchment/40" dir="ltr">
          {progressLabel}
        </span>
      </div>

      {(urlLoading || phase === "loading") && (
        <p className="text-center text-sm text-parchment/40">در حال آماده‌سازی صدا…</p>
      )}
      {urlError && (
        <p className="rounded-card bg-rust/10 px-5 py-3 text-center text-sm text-rust">
          خطا در گرفتن صدا: {urlError}
        </p>
      )}

      {currentItem && phase !== "loading" && (
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-2 text-center text-xs text-parchment/40">
            {pattern?.grammar_structure_fa}
          </p>

          <p className="mb-8 text-center font-display text-2xl leading-relaxed text-parchment">
            {currentItem.sentence_fa}
          </p>

          {phase === "prompt" && (
            <p className="text-center text-sm text-amber">🔊 در حال پخش جمله‌ی استاد…</p>
          )}

          {phase === "paused" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-teal">حالا نوبت توست — بلند جواب بده</p>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleRecordToggle}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${
                    recording ? "bg-rust" : "bg-ink-soft border border-parchment/20"
                  }`}
                  aria-label={recording ? "توقف ضبط" : "ضبط پاسخ من"}
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-7 w-7 text-parchment">
                    {recording ? (
                      <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
                    ) : (
                      <>
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                </button>
                <p className="text-xs text-parchment/40">
                  {recording
                    ? "در حال ضبط… دوباره بزن تا تمام شود"
                    : saveStatus === "saving"
                    ? "در حال ذخیره…"
                    : saveStatus === "saved"
                    ? "صدات ذخیره شد ✓"
                    : saveStatus === "error"
                    ? "ذخیره نشد — دوباره امتحان کن"
                    : "می‌تونی صدای خودت رو هم ضبط کنی (اختیاری)"}
                </p>
                {recordError && <p className="text-xs text-rust">{recordError}</p>}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => playSegment("prompt")}
                  className="rounded-card border border-parchment/20 px-5 py-3 text-sm text-parchment/70"
                >
                  🔁 دوباره بشنو
                </button>
                <button
                  onClick={() => playSegment("answer")}
                  className="rounded-card bg-amber px-6 py-3 font-display text-ink"
                >
                  پاسخ رو بشنو ▶
                </button>
              </div>
            </div>
          )}

          {phase === "answer" && (
            <div className="space-y-4">
              {revealText ? (
                <p className="text-center font-display text-xl text-amber" dir="ltr">
                  {currentItem.sentence_en}
                </p>
              ) : (
                <p className="text-center text-sm text-parchment/40">🔊 در حال پخش پاسخ…</p>
              )}

              {revealText && (
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => playSegment("answer")}
                    className="rounded-card border border-parchment/20 px-5 py-3 text-sm text-parchment/70"
                  >
                    🔁 دوباره پاسخ
                  </button>
                  <button
                    onClick={goToNext}
                    className="rounded-card bg-teal px-6 py-3 font-display text-parchment"
                  >
                    بعدی →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
