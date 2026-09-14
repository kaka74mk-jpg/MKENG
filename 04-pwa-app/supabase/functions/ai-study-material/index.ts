import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Material = {
  patterns: Array<{ grammar_structure_en: string; grammar_structure_fa: string; example_en: string; example_fa: string; level: string }>;
  vocabulary: Array<{ word: string; meaning: string; pronunciation: string; example: string; category: string; level: string }>;
  insights: Array<{ category: 'vocab'|'idiom'|'grammar_note'|'pronunciation'; raw_snippet: string; explanation: string; example: string; level: string }>;
  exercises: Array<{ prompt_fa: string; answer_en: string; pattern_structure_en: string }>;
};

function jsonFromText(text: string): Material {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI returned invalid JSON.');
  return JSON.parse(match[0]) as Material;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) throw new Error('Missing authorization.');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    const { lesson_id, transcript_id } = await req.json();
    if (!lesson_id || !transcript_id) throw new Error('lesson_id and transcript_id are required.');

    const { data: transcript, error: transcriptError } = await supabase.from('lesson_transcripts').select('*').eq('id', transcript_id).eq('lesson_id', lesson_id).eq('user_id', user.id).single();
    if (transcriptError || !transcript) throw new Error('Transcript not found.');

    const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id,title').eq('id', lesson_id).eq('user_id', user.id).single();
    if (lessonError || !lesson) throw new Error('Lesson not found.');

    const prompt = `You are the content engine for MK English Pro.\nLesson: ${lesson.title}\n\nCreate study material from the transcript below. The transcript is a study source, NOT a script that should control audio playback. Never invent classroom events. Prefer useful, reusable English patterns and vocabulary actually supported by the transcript. Keep explanations concise. Return ONLY valid JSON matching this shape:\n${JSON.stringify({patterns:[{grammar_structure_en:'',grammar_structure_fa:'',example_en:'',example_fa:'',level:'A1'}],vocabulary:[{word:'',meaning:'',pronunciation:'',example:'',category:'word',level:'A1'}],insights:[{category:'grammar_note',raw_snippet:'',explanation:'',example:'',level:'A1'}],exercises:[{prompt_fa:'',answer_en:'',pattern_structure_en:''}]})}\nUse 3-8 patterns, 5-12 vocabulary items, 2-6 insights, and 3-8 exercises. Levels must be A1/A2/B1/B2/C1.\n\nTRANSCRIPT:\n${transcript.full_text}`;

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');
    const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'system', content: 'Return JSON only.' }, { role: 'user', content: prompt }] }),
    });
    if (!response.ok) throw new Error(`AI provider error: ${await response.text()}`);
    const result = await response.json();
    const material = jsonFromText(result.choices?.[0]?.message?.content ?? '');

    const rows = [
      ...material.patterns.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'pattern', title: item.grammar_structure_en, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.vocabulary.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'vocabulary', title: item.word, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.insights.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'insight', title: item.raw_snippet, payload: item, source_basis: 'transcript', status: 'pending' })),
      ...material.exercises.map((item) => ({ user_id: user.id, lesson_id, transcript_id, content_type: 'exercise', title: item.prompt_fa, payload: item, source_basis: 'transcript', status: 'pending' })),
    ];
    const { data, error } = await supabase.from('ai_content_drafts').insert(rows).select('id,content_type,title,payload,status,created_at');
    if (error) throw new Error(error.message);
    return new Response(JSON.stringify({ ok: true, drafts: data ?? [] }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
