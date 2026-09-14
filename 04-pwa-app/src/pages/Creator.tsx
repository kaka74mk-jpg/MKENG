import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Chapter, Lesson, Level, Package, Season } from "../types/database";

type Notice = { kind: "ok" | "error"; text: string } | null;

export default function Creator() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [packageId, setPackageId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [title, setTitle] = useState("");
  const [levelCode, setLevelCode] = useState<"A1" | "A2" | "B1" | "B2" | "C1">("B1");
  const [pdf, setPdf] = useState<File | null>(null);
  const [driveLink, setDriveLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [chapterLessons, setChapterLessons] = useState<Lesson[]>([]);

  useEffect(() => { void loadHierarchy(); }, []);
  useEffect(() => {
    if (!chapterId) { setChapterLessons([]); return; }
    supabase.from("lessons").select("*").eq("chapter_id", chapterId).order("order_index", { ascending: true })
      .then(({ data }) => setChapterLessons(data ?? []));
  }, [chapterId]);

  async function loadHierarchy() {
    const [p, l, s, c] = await Promise.all([
      supabase.from("packages").select("*").order("created_at", { ascending: true }),
      supabase.from("levels").select("*").order("order_index", { ascending: true }),
      supabase.from("seasons").select("*").order("order_index", { ascending: true }),
      supabase.from("chapters").select("*").order("order_index", { ascending: true }),
    ]);
    setPackages(p.data ?? []); setLevels(l.data ?? []); setSeasons(s.data ?? []); setChapters(c.data ?? []);
    if (!packageId && p.data?.[0]) setPackageId(p.data[0].id);
    if (!levelId && l.data?.[0]) setLevelId(l.data[0].id);
    if (!seasonId && s.data?.[0]) setSeasonId(s.data[0].id);
    if (!chapterId && c.data?.[0]) setChapterId(c.data[0].id);
  }

  async function createContainer(kind: "package" | "level" | "season" | "chapter") {
    const value = window.prompt(`نام ${kind} جدید را وارد کنید:`)?.trim();
    if (!value) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    let error: { message: string } | null = null;
    if (kind === "package") {
      const r = await supabase.from("packages").insert({ user_id: userData.user.id, title: value }).select().single();
      error = r.error;
    } else if (kind === "level") {
      if (!packageId) return setNotice({ kind: "error", text: "ابتدا یک Package انتخاب کنید." });
      const r = await supabase.from("levels").insert({ user_id: userData.user.id, package_id: packageId, title: value, code: levelCode, order_index: levels.length }).select().single();
      error = r.error;
    } else if (kind === "season") {
      if (!levelId) return setNotice({ kind: "error", text: "ابتدا یک Level انتخاب کنید." });
      const r = await supabase.from("seasons").insert({ user_id: userData.user.id, level_id: levelId, title: value, order_index: seasons.length }).select().single();
      error = r.error;
    } else {
      if (!seasonId) return setNotice({ kind: "error", text: "ابتدا یک Season انتخاب کنید." });
      const r = await supabase.from("chapters").insert({ user_id: userData.user.id, season_id: seasonId, title: value, order_index: chapters.length }).select().single();
      error = r.error;
    }
    if (error) setNotice({ kind: "error", text: error.message });
    else { setNotice({ kind: "ok", text: `${kind} ساخته شد.` }); await loadHierarchy(); }
  }

  async function updateLesson(lesson: Lesson, updates: Partial<Lesson>) {
    const { error } = await supabase.from("lessons").update(updates).eq("id", lesson.id);
    if (error) setNotice({ kind: "error", text: error.message });
    else {
      setChapterLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, ...updates } : item));
      setNotice({ kind: "ok", text: "Lesson به‌روزرسانی شد." });
    }
  }

  async function createLesson(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (!chapterId || !title.trim()) {
      setNotice({ kind: "error", text: "Chapter و نام Lesson را مشخص کنید." });
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("نشست کاربر معتبر نیست.");
      const { data: lesson, error: lessonError } = await supabase.from("lessons").insert({
        user_id: userData.user.id, chapter_id: chapterId, title: title.trim(), status: "draft", order_index: lessons.length,
      }).select().single();
      if (lessonError || !lesson) throw new Error(lessonError?.message ?? "ساخت Lesson ناموفق بود.");

      if (pdf) await uploadPdf(userData.user.id, lesson, pdf);

      if (driveLink.trim()) {
        const { data: audioSource, error: audioError } = await supabase.from("audio_sources").insert({
          user_id: userData.user.id, lesson_id: lesson.id, source_type: "google_drive_import", original_drive_link: driveLink.trim(), status: "pending",
        }).select().single();
        if (audioError || !audioSource) throw new Error(audioError?.message ?? "ساخت Audio Source ناموفق بود.");
        const { data, error } = await supabase.functions.invoke("import-drive-audio", {
          body: { audio_source_id: audioSource.id, drive_link: driveLink.trim(), lesson_id: lesson.id },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
      }

      setChapterLessons((current) => [...current, lesson]);
      setTitle(""); setPdf(null); setDriveLink("");
      setNotice({ kind: "ok", text: "Lesson ساخته شد. فعلاً به‌صورت Draft ذخیره شده است." });
      await loadHierarchy();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "ساخت Lesson ناموفق بود." });
    } finally { setBusy(false); }
  }

  async function uploadPdf(userId: string, lesson: Lesson, file: File) {
    if (file.type !== "application/pdf") throw new Error("فایل Lesson باید PDF باشد.");
    if (file.size > 50 * 1024 * 1024) throw new Error("حداکثر حجم PDF برابر 50MB است.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${lesson.id}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("lesson-pdfs").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (uploadError) throw new Error(uploadError.message);
    const { error: updateError } = await supabase.from("lessons").update({ pdf_storage_path: path, pdf_original_filename: file.name }).eq("id", lesson.id);
    if (updateError) throw new Error(updateError.message);
  }

  const onPdfChange = (event: ChangeEvent<HTMLInputElement>) => setPdf(event.target.files?.[0] ?? null);

  const filteredLevels = levels.filter((item) => item.package_id === packageId);
  const filteredSeasons = seasons.filter((item) => item.level_id === levelId);
  const filteredChapters = chapters.filter((item) => item.season_id === seasonId);

  return (
    <div className="px-5 pt-8 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div><p className="text-xs uppercase tracking-[0.2em] text-amber">Creator Mode</p><h1 className="mt-2 font-display text-2xl text-parchment">ساخت محتوای کلاس</h1></div>
        <Link to="/profile" className="text-xs text-parchment/45">پروفایل</Link>
      </div>

      <section className="space-y-3 rounded-card bg-ink-soft p-5">
        <SectionTitle title="ساختار درس" />
        <Select label="Package" value={packageId} onChange={setPackageId} options={packages.map((x) => [x.id, x.title])} />
        <button onClick={() => void createContainer("package")} className="text-right text-xs text-amber">+ ساخت Package</button>
        <Select label="Level" value={levelId} onChange={setLevelId} options={filteredLevels.map((x) => [x.id, `${x.code} — ${x.title}`])} />
        <div className="flex gap-2"><select value={levelCode} onChange={(e) => setLevelCode(e.target.value as typeof levelCode)} className="flex-1 rounded-xl bg-ink px-3 py-2 text-sm text-parchment"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select><button onClick={() => void createContainer("level")} className="rounded-xl bg-amber px-3 text-xs font-semibold text-ink">+ Level</button></div>
        <Select label="Season" value={seasonId} onChange={setSeasonId} options={filteredSeasons.map((x) => [x.id, x.title])} />
        <button onClick={() => void createContainer("season")} className="text-right text-xs text-amber">+ ساخت Season</button>
        <Select label="Chapter" value={chapterId} onChange={setChapterId} options={filteredChapters.map((x) => [x.id, x.title])} />
        <button onClick={() => void createContainer("chapter")} className="text-right text-xs text-amber">+ ساخت Chapter</button>
      </section>

      <form onSubmit={createLesson} className="mt-5 space-y-4 rounded-card bg-ink-soft p-5">
        <SectionTitle title="Lesson جدید" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="نام Lesson" className="w-full rounded-xl bg-ink px-4 py-3 text-sm text-parchment outline-none" />
        <label className="block rounded-xl border border-dashed border-parchment/15 p-4 text-sm text-parchment/60">PDF جلسه<input type="file" accept="application/pdf" onChange={onPdfChange} className="mt-2 block w-full text-xs" />{pdf && <span className="mt-2 block text-xs text-teal">{pdf.name}</span>}</label>
        <label className="block"><span className="mb-2 block text-xs text-parchment/45">Google Drive audio link</span><input value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." dir="ltr" className="w-full rounded-xl bg-ink px-4 py-3 text-sm text-parchment outline-none" /></label>
        <p className="text-xs leading-6 text-parchment/40">Lesson ابتدا Draft می‌ماند. فایل صوتی بعد از ساخت رکورد، از طریق Edge Function به Storage خصوصی منتقل می‌شود.</p>
        <button disabled={busy} className="w-full rounded-2xl bg-amber px-4 py-3 font-semibold text-ink disabled:opacity-50">{busy ? "در حال ساخت…" : "ساخت Lesson"}</button>
      </form>

      {notice && <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${notice.kind === "ok" ? "bg-teal/15 text-teal" : "bg-rust/10 text-rust"}`}>{notice.text}</div>}

      {chapterId && (
        <section className="mt-5 space-y-3 rounded-card bg-ink-soft p-5">
          <SectionTitle title="Lessonهای این Chapter" />
          {chapterLessons.length === 0 && <p className="text-sm text-parchment/40">هنوز Lessonی ساخته نشده.</p>}
          {chapterLessons.map((lesson) => (
            <div key={lesson.id} className="rounded-2xl bg-ink px-4 py-4">
              <div className="flex items-center gap-2">
                <a href={`/creator/lesson/${lesson.id}/study`} className="rounded-full bg-teal/15 px-3 py-1 text-[11px] text-teal">Study Lab</a>
                <input value={lesson.title} onChange={(e) => setChapterLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, title: e.target.value } : item))} onBlur={(e) => void updateLesson(lesson, { title: e.target.value.trim() || lesson.title })} className="min-w-0 flex-1 bg-transparent text-sm text-parchment outline-none" />
                <button onClick={() => void updateLesson(lesson, { status: lesson.status === "published" ? "draft" : "published" })} className={`rounded-full px-3 py-1 text-[11px] ${lesson.status === "published" ? "bg-teal/20 text-teal" : "bg-amber/15 text-amber"}`}>{lesson.status === "published" ? "Published" : "Draft"}</button>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) { return <h2 className="font-display text-lg text-parchment">{title}</h2>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-2 block text-xs text-parchment/45">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl bg-ink px-3 py-3 text-sm text-parchment"><option value="">انتخاب کنید…</option>{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>;
}
