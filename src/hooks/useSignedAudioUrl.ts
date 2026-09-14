/**
 * useSignedAudioUrl
 * ------------------
 * چرا این فایل وجود دارد:
 *   تمام باکت‌های Storage در این پروژه Private هستند (تصمیم معماری، نه یک محدودیت
 *   موقت — چون فایل‌های کلاس شخصی‌اند). یعنی هیچ audio_source یا فایل صوتی دیگری
 *   یک URL عمومی و همیشگی ندارد. برای پخش هر فایل، باید هر بار (یا هر چند دقیقه)
 *   یک Signed URL موقت از Supabase بگیریم.
 *
 * این هوک یک storage_path (مثلاً "user-id/lesson-id/class.mp3") می‌گیرد و یک
 * Signed URL موقت (پیش‌فرض معتبر برای ۱ ساعت) برمی‌گرداند که مستقیماً در تگ
 * <audio src="..."> قابل استفاده است.
 *
 * محل استفاده فعلی: src/pages/DrillSession.tsx (فاز ۲ — پخش‌کننده‌ی Drill)
 * در آینده صفحات Listen.tsx و پخش‌کننده‌ی شنیدن آزاد هم باید از همین هوک استفاده کنند
 * (فعلاً Listen.tsx فقط لیست را نشان می‌دهد و دکمه‌ی پخش‌اش هنوز واقعی نیست).
 */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface UseSignedAudioUrlResult {
  url: string | null;
  loading: boolean;
  error: string | null;
}

export function useSignedAudioUrl(
  storagePath: string | null | undefined,
  bucket: string = "lesson-audio",
  expiresInSeconds: number = 3600
): UseSignedAudioUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds)
      .then(({ data, error: signError }) => {
        if (cancelled) return;
        if (signError) {
          setError(signError.message);
          setUrl(null);
        } else {
          setUrl(data?.signedUrl ?? null);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath, bucket, expiresInSeconds]);

  return { url, loading, error };
}
