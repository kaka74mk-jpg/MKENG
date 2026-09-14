import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { DrillItem } from "../types/database";

type Props = { items: DrillItem[] };

export default function OptionalSpeakingPractice({ items }: Props) {
  const [selected, setSelected] = useState(items[0]?.id ?? "");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => { if (!selected && items[0]) setSelected(items[0].id); }, [items, selected]);
  const item = items.find((x) => x.id === selected);

  async function start() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) return setMessage("Microphone recording is not supported in this browser.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((x) => MediaRecorder.isTypeSupported(x));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => { stream.getTracks().forEach((track) => track.stop()); void saveRecording(recorder.mimeType || "audio/webm"); };
      recorderRef.current = recorder; startedAtRef.current = Date.now(); recorder.start(); setRecording(true);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Microphone permission was denied."); }
  }

  function stop() { recorderRef.current?.stop(); setRecording(false); }

  async function saveRecording(mimeType: string) {
    if (!item || !chunksRef.current.length) return;
    setBusy(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error("You are not signed in.");
      const ext = mimeType.includes("ogg") ? "ogg" : "webm";
      const path = `${userId}/${item.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("voice-recordings").upload(path, blob, { contentType: mimeType, upsert: false });
      if (uploadError) throw new Error(uploadError.message);
      const { error } = await supabase.from("voice_recordings").insert({ user_id: userId, drill_item_id: item.id, storage_path: path, duration_seconds: (Date.now() - startedAtRef.current) / 1000 });
      if (error) throw new Error(error.message);
      setMessage("Recording saved. It did not interrupt the original classroom audio.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save recording."); }
    finally { setBusy(false); }
  }

  if (!items.length) return null;
  return (
    <section className="mt-6 rounded-card border border-teal/20 bg-ink-soft p-5">
      <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-teal">Optional</p><h2 className="mt-1 font-display text-lg text-parchment">Speaking Practice</h2></div><span className="text-[10px] text-parchment/35">Not part of class playback</span></div>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-4 w-full rounded-xl bg-ink px-3 py-3 text-sm text-parchment" aria-label="Select a speaking item">
        {items.map((x) => <option key={x.id} value={x.id}>{x.sentence_en}</option>)}
      </select>
      {item && <><p className="mt-4 text-sm text-parchment/60">{item.sentence_fa}</p><p className="mt-1 text-base text-amber" dir="ltr">{item.sentence_en}</p></>}
      <button onClick={() => void (recording ? stop() : start())} disabled={busy} className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold ${recording ? "bg-rust/15 text-rust" : "bg-teal/20 text-teal"}`}>{busy ? "Saving…" : recording ? "Stop & Save" : "Record Yourself"}</button>
      {message && <p className="mt-3 text-xs leading-5 text-parchment/50">{message}</p>}
    </section>
  );
}
