/**
 * useVoiceRecorder
 * -----------------
 * چرا این فایل وجود دارد:
 *   فاز ۳ پروژه — ضبط صدای کاربر موقع تمرین Drill. این هوک یک لایه‌ی نازک روی
 *   MediaRecorder مرورگر است؛ خودِ آپلود به Supabase Storage و ثبت رکورد در
 *   جدول voice_recordings داخل DrillSession.tsx انجام می‌شود (چون به context
 *   درسِ جاری/drill_item نیاز دارد)، نه اینجا. این هوک فقط «ضبط کن / تمومش کن
 *   و بلاب رو بده» را بلد است.
 *
 * نکات فنی مهم:
 *   - نیاز به HTTPS دارد (یا localhost) — مرورگرها در HTTP معمولی اجازه‌ی
 *     دسترسی به میکروفون نمی‌دهند. روی Vercel/هر هاست دیگر با HTTPS مشکلی نیست.
 *   - فرمت خروجی معمولاً audio/webm است (پشتیبانی گسترده در Chrome/Firefox/Edge).
 *     سافاری ممکن است audio/mp4 بدهد — bucket «voice-recordings» هر دو را
 *     در allowed_mime_types می‌پذیرد (چک کنید mk_english_pro_storage.sql).
 *   - اگر کاربر دسترسی میکروفون را رد کند یا دستگاه میکروفون نداشته باشد،
 *     پیام خطای فارسی در error برمی‌گردد؛ UI باید این را نشان دهد نه این‌که
 *     کاربر را گیر بیندازد (ضبط صدا باید همیشه اختیاری بماند).
 */
import { useRef, useState } from "react";

interface UseVoiceRecorderResult {
  recording: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredType = "audio/webm";
      const options = MediaRecorder.isTypeSupported(preferredType)
        ? { mimeType: preferredType }
        : undefined;

      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();

      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("دسترسی به میکروفون داده نشد. لطفاً از تنظیمات مرورگر اجازه بدهید.");
    }
  }

  function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }

  return { recording, error, start, stop };
}
