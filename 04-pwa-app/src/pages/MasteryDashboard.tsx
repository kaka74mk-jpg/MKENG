import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { getMasteryDashboard, masteryBand, type MasteryDashboardData, type MasteryDashboardRow } from "../lib/masteryDashboard";

export default function MasteryDashboard() {
  const [data, setData] = useState<MasteryDashboardData | null>(null);
  const [filter, setFilter] = useState<"all" | "needs" | "due">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getMasteryDashboard());
    } catch (err) {
      console.error(err);
      setError("Mastery data could not be loaded. Check your sign-in and Supabase connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "needs") return data.rows.filter((r) => r.mastery < 60);
    if (filter === "due") return data.rows.filter((r) => r.due);
    return data.rows;
  }, [data, filter]);

  if (loading) return <State title="Mastery" message="Loading your learning map…" />;
  if (error) return <State title="Mastery" message={error} action={<button onClick={load} className="text-amber hover:underline">Try again</button>} />;
  if (!data) return null;

  const accuracy = data.attempts ? Math.round((data.correctAttempts / data.attempts) * 100) : 0;

  return (
    <div className="px-5 pt-7 pb-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-amber">PROGRESS · PHASE 7D</p>
          <h1 className="mt-1 font-display text-3xl text-parchment">Your mastery</h1>
          <p className="mt-2 text-sm text-parchment/45">یک نگاه واقعی به چیزهایی که بلدی، چیزهایی که در حال یادگیری‌شان هستی و چیزهایی که باید دوباره تمرین کنی.</p>
        </div>
        <button onClick={load} aria-label="Refresh mastery" className="rounded-full border border-parchment/10 px-3 py-2 text-xs text-parchment/55">↻</button>
      </header>

      <section className="rounded-card bg-parchment p-5 text-ink shadow-lg">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-ink/45">Overall mastery</p>
            <p className="mt-1 font-display text-5xl">{Math.round(data.averageMastery)}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{data.rows.length} patterns</p>
            <p className="mt-1 text-xs text-ink/50">{data.dueReviews} due now</p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, data.averageMastery)}%` }} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={data.needsWorkCount} label="Needs work" tone="rust" />
        <Stat value={data.developingCount} label="Developing" tone="amber" />
        <Stat value={data.strongCount + data.solidCount} label="Solid+" tone="teal" />
      </section>

      <section className="mt-4 rounded-card bg-ink-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-parchment/35">Last 7 days</p>
            <p className="mt-1 text-sm text-parchment">{data.attempts} recall attempts · {accuracy}% correct</p>
          </div>
          <p className="font-display text-2xl text-amber">{data.attempts}<span className="ml-1 text-xs font-sans text-parchment/40">attempts</span></p>
        </div>
      </section>

      <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-1">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
        <FilterButton active={filter === "needs"} onClick={() => setFilter("needs")}>Needs attention</FilterButton>
        <FilterButton active={filter === "due"} onClick={() => setFilter("due")}>Due now</FilterButton>
      </div>

      <section className="mt-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-card border border-parchment/10 p-6 text-center text-sm text-parchment/45">Nothing matches this filter yet.</div>
        ) : filtered.map((row) => <MasteryRow key={row.patternId} row={row} />)}
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link to="/review" className="rounded-2xl bg-amber px-4 py-3 text-center text-sm font-semibold text-ink">Review due</Link>
        <Link to="/coach" className="rounded-2xl border border-parchment/10 px-4 py-3 text-center text-sm text-parchment/70">Ask AI Coach</Link>
      </div>
    </div>
  );
}

function MasteryRow({ row }: { row: MasteryDashboardRow }) {
  const band = masteryBand(row.mastery);
  const tone = band === "Strong" || band === "Solid" ? "text-teal" : band === "Developing" ? "text-amber" : "text-rust";
  return (
    <article className="rounded-2xl border border-parchment/8 bg-ink-soft px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-parchment" dir="ltr">{row.pattern}</p>
          <p className={`mt-1 text-xs ${tone}`}>{band}{row.due ? " · Due now" : ""}</p>
        </div>
        <p className="flex-none font-display text-2xl text-parchment">{Math.round(row.mastery)}%</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-parchment/10">
        <div className="h-full rounded-full bg-amber" style={{ width: `${row.mastery}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-parchment/35">
        <span>{row.correct} correct · {row.incorrect} incorrect</span>
        <span>{row.exposures} exposures</span>
      </div>
    </article>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${active ? "bg-amber text-ink" : "border border-parchment/10 text-parchment/50"}`}>{children}</button>;
}

function Stat({ value, label, tone }: { value: number; label: string; tone: "rust" | "amber" | "teal" }) {
  const cls = tone === "rust" ? "text-rust" : tone === "amber" ? "text-amber" : "text-teal";
  return <div className="rounded-2xl bg-ink-soft px-3 py-3"><p className={`font-display text-2xl ${cls}`}>{value}</p><p className="mt-1 text-[11px] text-parchment/40">{label}</p></div>;
}

function State({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="px-5 pt-12 text-center"><h1 className="font-display text-2xl text-parchment">{title}</h1><p className="mt-3 text-sm leading-6 text-parchment/50">{message}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
