import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);
const INSIGHT_CATEGORIES = new Set(['vocab', 'idiom', 'grammar_note', 'pronunciation']);
const MAX_TRANSCRIPT_CHARS = 120_000;
const MAX_ITEMS = 100;

type Material = {
  patterns: Array<{ grammar_structure_en: string; grammar_structure_fa: string; example_en: string; example_fa: string; level: string }>;
  vocabulary: Array<{ word: string; meaning: string; pronunciation: string; example: string; category: string; level: string }>;
  insights: Array<{ category: 'vocab'|'idiom'|'grammar_note'|'pronunciation'; raw_snippet: string; explanation: string; example: string; level: string }>;
  exercises: Array<{ prompt_fa: string; answer_en: string; pattern_structure_en: string }>;
};

function clean(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function jsonFromText(text: string): Material {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('AI returned invalid JSON.');
    try { parsed = JSON.parse(cleaned.slice(start, end + 1)); }
    catch { throw new Error('AI returned invalid JSON.'); }
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('AI returned an invalid material object.');
  const source = parsed as Record<string, unknown>;
  const array = (key: string) => Array.isArray(source[key]) ? source[key] : [];
  const patterns = array('patterns').map((x) => {
    const p = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const level = clean(p.level, 2).toUpperCase();
    return { grammar_structure_en: clean(p.grammar_structure_en, 180), grammar_structure_fa: clean(p.grammar_structure_fa, 500), example_en: clean(p.example_en, 800), example_fa: clean(p.example_fa, 800), level };
  }).filter((p) => p.grammar_structure_en && p.example_en && LEVELS.has(p.level));
  const vocabulary = array('vocabulary').map((x) => {
    const p = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const level = clean(p.level, 2).toUpperCase();
    return { word: clean(p.word, 120), meaning: clean(p.meaning, 500), pronunciation: clean(p.pronunciation, 200), example: clean(p.example, 800), category: clean(p.category, 80), level };
  }).filter((p) => p.word && p.meaning && p.example && LEVELS.has(p.level));
  const insights = array('insights').map((x) => {
    const p = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    const category = clean(p.category, 30).toLowerCase();
    const level = clean(p.level, 2).toUpperCase();
    return { category, raw_snippet: clean(p.raw_snippet, 800), explanation: clean(p.explanation, 1200), example: clean(p.example, 800), level };
  }).filter((p) => INSIGHT_CATEGORIES.has(p.category) && !!p.raw_snippet && !!p.explanation && !!p.example && LEVELS.has(p.level)) as Material['insights'];
  const exercises = array('exercises').map((x) => {
    const p = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return { prompt_fa: clean(p.prompt_fa, 800), answer_en: clean(p.answer_en, 800), pattern_structure_en: clean(p.pattern_structure_en, 180) };
  }).filter((p) => p.prompt_fa && p.answer_en && p.pattern_structure_en);

  if (patterns.length > 8 || vocabulary.length > 12 || insights.length > 6 || exercises.length > 8) throw new Error('AI returned too many items.');
  if (!patterns.length && !vocabulary.length && !insights.length && !exercises.length) throw new Error('AI returned no usable study material.');
  return { patterns, vocabulary, insights, exercises };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Missing authorization.');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { lesson_id, transcript_id } = await req.json();
    if (typeof lesson_id !== 'string' || typeof transcript_id !== 'string') throw new Error('lesson_id and transcript_id are required.');

    const { data: transcript, error: transcriptError } = await supabase.from('lesson_transcripts').select('*').eq('id', transcript_id).eq('lesson_id', lesson_id).eq('user_id', user.id).single();
    if (transcriptError || !transcript) throw new Error('Transcript not found.');
    if (!transcript.full_text?.trim()) throw new Error('Transcript is empty.');
    if (transcript.full_text.length > MAX_TRANSCRIPT_CHARS) throw new Error(`Transcript is too long. Maximum is ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters.`);

    const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id,title').eq('id', lesson_id).eq('user_id', user.id).single();
    if (lessonError || !lesson) throw new Error('Lesson not found.');

    const prompt = `You are the content engine for MK English Pro.\nLesson: ${lesson.title}\n\nCreate study material from the transcript below. The transcript is a study source, NOT a script that should control audio playback. Never invent classroom events. Prefer useful, reusable English patterns and vocabulary actually supported by the transcript. Keep explanations concise. Return ONLY valid JSON matching this shape:\n${JSON.stringify({patterns:[{grammar_structure_en:'',grammar_structure_fa:'',example_en:'',example_fa:'',level:'A1'}],vocabulary:[{word:'',meaning:'',pronunciation:'',example:'',category:'word',level:'A1'}],insights:[{category:'grammar_note',raw_snippet:'',explanation:'',example:'',level:'A1'}],exercises:[{prompt_fa:'',answer_en:'',pattern_structure_en:''}])}\nUse up to 8 patterns, 12 vocabulary items, 6 insights, and 8 exercises. Levels must be A1/A2/B1/B2/C1.\n\nTRANSCRIPT:\n${transcript.full_text}`;

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');
    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Return JSON only.' }, { role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new Error(`AI provider error: ${await response.text()}`);
    const result = await response.json();
    const material = jsonFromText(result.choices?.[0]?.message?.content ?? '');

    const rows = [
      ...material.patterns.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'pattern', title: item.grammar_structure_en, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.vocabulary.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'vocabulary', title: item.word, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.insights.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'insight', title: item.raw_snippet, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.exercises.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'exercise', title: item.prompt_fa, payload: item, source_basis: 'transcript', status: 'pending' })),
    ].slice(0, MAX_ITEMS);
    if (!rows.length) throw new Error('No valid draft rows were produced.');
    const { data, error } = await supabase.from('ai_content_drafts').insert(rows).select('id,content_type,title,payload,status,created_at');
    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({ ok: true, drafts: data ?? [] }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
