import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getSignedUrl } from "../lib/storage";
import type { AudioSource, LessonListeningProgress } from "../types/database";

type Props = { lessonId: string; source: AudioSource; compact?: boolean };

export default function ContinuousAudioPlayer({ lessonId, source, compact = false }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const lastSavedRef = useRef(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(source.duration_seconds ?? 0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  const enqueueProgressSave = useCallback((completed = false, force = false) => {
    const audio = audioRef.current;
    if (!audio || (!force && Math.abs(audio.currentTime - lastSavedRef.current) < 4)) return;
    const positionToSave = Math.max(0, audio.currentTime);
    const durationToSave = Number.isFinite(audio.duration) ? audio.duration : duration || null;
    lastSavedRef.current = positionToSave;
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      const { error: rpcError } = await supabase.rpc("save_lesson_listening_progress", {
        p_lesson_id: lessonId, p_audio_source_id: source.id, p_position_seconds: positionToSave,
        p_duration_seconds: durationToSave, p_completed: completed,
      });
      if (rpcError) { console.error("Failed to save listening progress", rpcError); setSaveWarning("جای شما فعلاً روی سرور ذخیره نشد؛ اتصال را بررسی کنید."); }
      else setSaveWarning(null);
    });
  }, [duration, lessonId, source.id]);

  useEffect(() => {
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let cleanup: (() => void) | undefined;
    async function prepare() {
      if (!source.storage_path) return;
      setLoading(true); setReady(false); setError(null); setSaveWarning(null);
      try {
        const [{ data: progress, error: progressError }, url] = await Promise.all([
          supabase.from("lesson_listening_progress").select("*").eq("lesson_id", lessonId).eq("audio_source_id", source.id).maybeSingle(),
          getSignedUrl("lesson-audio", source.storage_path),
        ]);
        if (progressError) throw new Error(`Could not load saved position: ${progressError.message}`);
        if (cancelled) return;
        audio = new Audio(); audio.preload = "metadata"; audio.src = url; audioRef.current = audio;
        const saved = Number((progress as LessonListeningProgress | null)?.position_seconds ?? 0);
        const onLoadedMetadata = () => {
          setDuration(Number.isFinite(audio?.duration ?? NaN) ? audio!.duration : source.duration_seconds ?? 0);
          if (audio && saved > 0 && saved < audio.duration - 2) audio.currentTime = saved;
          lastSavedRef.current = saved; setPosition(saved > 0 ? saved : 0); setReady(true);
        };
        const onTimeUpdate = () => { if (audio) setPosition(audio.currentTime); };
        const onPlay = () => setPlaying(true);
        const onPause = () => { setPlaying(false); enqueueProgressSave(false, true); };
        const onEnded = () => { if (!audio) return; setPlaying(false); setPosition(audio.duration); enqueueProgressSave(true, true); };
        const onError = () => setError("Audio could not be loaded or played.");
        audio.addEventListener("loadedmetadata", onLoadedMetadata); audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("play", onPlay); audio.addEventListener("pause", onPause); audio.addEventListener("ended", onEnded); audio.addEventListener("error", onError);
        cleanup = () => { audio?.removeEventListener("loadedmetadata", onLoadedMetadata); audio?.removeEventListener("timeupdate", onTimeUpdate); audio?.removeEventListener("play", onPlay); audio?.removeEventListener("pause", onPause); audio?.removeEventListener("ended", onEnded); audio?.removeEventListener("error", onError); };
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Audio could not be loaded."); }
      finally { if (!cancelled) setLoading(false); }
    }
    void prepare();
    return () => { cancelled = true; cleanup?.(); audio?.pause(); if (audioRef.current === audio) audioRef.current = null; };
  }, [enqueueProgressSave, lessonId, source.id, source.storage_path, source.duration_seconds]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => enqueueProgressSave(false), 5000);
    return () => window.clearInterval(timer);
  }, [playing, enqueueProgressSave]);

  async function toggle() {
    const audio = audioRef.current; if (!audio || !ready) return;
    try { if (audio.paused) await audio.play(); else audio.pause(); }
    catch (e) { setError(e instanceof Error ? e.message : "Audio playback was blocked by the browser."); }
  }
  function seek(value: number) { const audio = audioRef.current; if (!audio) return; audio.currentTime = value; setPosition(value); enqueueProgressSave(false, true); }

  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;
  return <section className={`rounded-card bg-ink-soft ${compact ? "p-4" : "p-5"}`}>
    <div className="flex items-center gap-3">
      <button onClick={() => void toggle()} disabled={loading || !ready} className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-amber text-ink disabled:opacity-40" aria-label={playing ? "Pause" : "Play continuously"}>
        {loading ? "…" : playing ? <span className="h-4 w-4 rounded-sm bg-ink" /> : <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M8 5v14l11-7Z" /></svg>}
      </button>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-parchment">Original classroom audio</p><p className="mt-0.5 text-xs text-parchment/45">Continuous playback · resume sync</p></div>
      <span className="text-xs tabular-nums text-parchment/45">{formatTime(position)}</span>
    </div>
    <input aria-label="Audio position" type="range" min={0} max={duration || 0} step={0.1} value={Math.min(position, duration || position)} onChange={(e) => seek(Number(e.target.value))} className="mt-4 w-full accent-amber" />
    <div className="mt-1 flex justify-between text-[10px] text-parchment/30"><span>0:00</span><span>{formatTime(duration)}</span></div>
    {error && <p className="mt-3 text-xs text-rust">{error}</p>}
    {saveWarning && !error && <p className="mt-3 text-xs text-rust">{saveWarning}</p>}
    {ready && !error && !saveWarning && <p className="mt-3 text-xs text-teal">Your position is saved automatically. The class recording is never auto-paused.</p>}
    <div className="mt-3 h-1 overflow-hidden rounded-full bg-parchment/10"><div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} /></div>
  </section>;
}
function formatTime(seconds: number) { if (!Number.isFinite(seconds) || seconds < 0) return "0:00"; const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${String(s).padStart(2, "0")}`; }
