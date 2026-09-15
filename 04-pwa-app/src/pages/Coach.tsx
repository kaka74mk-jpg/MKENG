import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { askCoach, getCoachContext, type CoachContext, type CoachMessage } from "../lib/aiCoach";

const starter = "I want to practice my weakest English pattern.";

export default function Coach() {
  const [params] = useSearchParams();
  const lessonId = params.get("lessonId");
  const [context, setContext] = useState<CoachContext | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCoachContext(lessonId).then(setContext).catch(() => setError("Coach data could not be loaded. Check your sign-in and Supabase connection."));
  }, [lessonId]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const content = input.trim();
    if (!content || busy || !context) return;
    const next = [...messages, { role: "user", content } as CoachMessage];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const reply = await askCoach(next, context);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setMessages((current) => current.slice(0, -1));
      setInput(content);
      setError("The AI Coach is unavailable right now. Your practice data is safe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-7 pb-6">
      <header className="mb-5">
        <p className="text-xs tracking-[0.2em] text-amber">AI COACH · PHASE 7C</p>
        <h1 className="mt-1 font-display text-3xl text-parchment">Practice with your coach</h1>
        {context && <p className="mt-2 text-sm text-parchment/50">{context.dueReviews} reviews due · {context.weakPatterns.length} weak patterns tracked</p>}
      </header>

      {context && context.weakPatterns.length > 0 && (
        <section className="mb-4 rounded-card border border-amber/15 bg-ink-soft p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-parchment/35">Focus today</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {context.weakPatterns.slice(0, 4).map((p) => (
              <span key={p.patternId} className="rounded-full bg-amber/10 px-3 py-1.5 text-xs text-amber">
                {p.pattern} · {Math.round(p.mastery)}%
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="min-h-[48vh] rounded-card bg-ink-soft p-4 shadow-lg">
        {messages.length === 0 ? (
          <div className="flex min-h-[42vh] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/15 text-xl text-teal">✦</div>
            <h2 className="mt-4 font-display text-xl text-parchment">Let’s practice</h2>
            <p className="mt-2 max-w-xs text-sm leading-6 text-parchment/45">I’ll use your review queue and weaker patterns to choose useful practice.</p>
            <button onClick={() => setInput(starter)} className="mt-5 rounded-2xl border border-parchment/10 px-4 py-3 text-sm text-parchment/70">Start with my weakest pattern</button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, i) => (
              <div key={`${message.role}-${i}`} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-amber text-ink" : "bg-ink text-parchment"}`}>
                {message.content}
              </div>
            ))}
            {busy && <div className="max-w-[88%] rounded-2xl bg-ink px-4 py-3 text-sm text-parchment/45">Thinking…</div>}
          </div>
        )}
      </section>

      {error && <p className="mt-3 text-center text-sm text-rust">{error}</p>}

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write your answer…" disabled={!context || busy} className="min-w-0 flex-1 rounded-2xl border border-parchment/10 bg-ink-soft px-4 py-3 text-sm text-parchment placeholder:text-parchment/25 focus:border-amber/40 focus:outline-none" />
        <button disabled={!input.trim() || !context || busy} className="rounded-2xl bg-amber px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40">Send</button>
      </form>
    </div>
  );
}
