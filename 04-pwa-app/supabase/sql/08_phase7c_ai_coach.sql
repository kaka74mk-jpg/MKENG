-- Phase 7C — AI Coach context helpers
-- AI provider secrets MUST stay in Supabase Edge Function secrets.
-- Never place OPENAI_API_KEY in the PWA or SQL.

create or replace function public.get_coach_weak_patterns(p_lesson_id uuid default null, p_limit int default 8)
returns table (
  pattern_id uuid,
  lesson_id uuid,
  pattern text,
  mastery_score numeric,
  next_review_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select p.id, p.lesson_id, p.grammar_structure_en, lm.mastery_score, lm.next_review_at
  from learner_mastery lm
  join patterns p on p.id = lm.entity_id
  where lm.user_id = auth.uid()
    and lm.entity_type = 'pattern'
    and (p_lesson_id is null or lm.last_session_id = p_lesson_id)
  order by lm.mastery_score asc, lm.next_review_at nulls first
  limit greatest(1, least(p_limit, 25));
$$;

grant execute on function public.get_coach_weak_patterns(uuid, int) to authenticated;
