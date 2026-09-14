-- MK English Pro — Phase 10 hardening migration.

alter table lesson_listening_progress
  drop constraint if exists lesson_listening_progress_user_id_lesson_id_key;

create unique index if not exists uq_lesson_listening_progress_user_lesson_source
  on lesson_listening_progress(user_id, lesson_id, audio_source_id)
  where audio_source_id is not null;

create or replace function save_lesson_listening_progress(
  p_lesson_id uuid, p_audio_source_id uuid, p_position_seconds numeric,
  p_duration_seconds numeric, p_completed boolean default false
) returns lesson_listening_progress
language plpgsql security invoker set search_path = public
as $$
declare result_row lesson_listening_progress;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_audio_source_id is null then raise exception 'audio_source_required'; end if;
  if not exists (select 1 from audio_sources a where a.id=p_audio_source_id and a.lesson_id=p_lesson_id and a.user_id=auth.uid()) then raise exception 'audio_source_not_owned'; end if;
  insert into lesson_listening_progress(user_id,lesson_id,audio_source_id,position_seconds,duration_seconds,completed,last_played_at,updated_at)
  values(auth.uid(),p_lesson_id,p_audio_source_id,greatest(0,coalesce(p_position_seconds,0)),case when p_duration_seconds is null then null else greatest(0,p_duration_seconds) end,coalesce(p_completed,false),now(),now())
  on conflict (user_id,lesson_id,audio_source_id) where audio_source_id is not null do update set
    position_seconds=excluded.position_seconds,duration_seconds=excluded.duration_seconds,completed=excluded.completed,last_played_at=now(),updated_at=now()
  returning * into result_row;
  return result_row;
end; $$;

grant execute on function save_lesson_listening_progress(uuid,uuid,numeric,numeric,boolean) to authenticated;

create or replace function publish_ai_content_draft(p_draft_id uuid)
returns ai_content_drafts language plpgsql security invoker set search_path=public
as $$
declare draft ai_content_drafts; result_draft ai_content_drafts; p jsonb; pattern_id_value uuid; next_order integer; target_pattern text; category_value text; level_value text; uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into draft from ai_content_drafts where id=p_draft_id and user_id=uid for update;
  if not found then raise exception 'draft_not_found'; end if;
  if draft.status <> 'pending' then raise exception 'draft_not_pending'; end if;
  p:=draft.payload;
  if draft.content_type='pattern' then
    if nullif(trim(p->>'grammar_structure_en'),'') is null then raise exception 'invalid_pattern'; end if;
    level_value:=p->>'level'; if level_value not in ('A1','A2','B1','B2','C1') then raise exception 'invalid_level'; end if;
    select coalesce(max(order_index),-1)+1 into next_order from patterns where lesson_id=draft.lesson_id and user_id=uid;
    insert into patterns(user_id,lesson_id,grammar_structure_en,grammar_structure_fa,example_en,example_fa,level,source,order_index) values(uid,draft.lesson_id,trim(p->>'grammar_structure_en'),nullif(p->>'grammar_structure_fa',''),nullif(p->>'example_en',''),nullif(p->>'example_fa',''),level_value::level_code,'transcript_ai',next_order);
  elsif draft.content_type='vocabulary' then
    if nullif(trim(p->>'word'),'') is null then raise exception 'invalid_vocabulary'; end if;
    level_value:=p->>'level'; if level_value not in ('A1','A2','B1','B2','C1') then raise exception 'invalid_level'; end if;
    insert into vocabulary(user_id,lesson_id,word,meaning,pronunciation,example,category,level,source) values(uid,draft.lesson_id,trim(p->>'word'),nullif(p->>'meaning',''),nullif(p->>'pronunciation',''),nullif(p->>'example',''),nullif(p->>'category',''),level_value::level_code,'transcript_ai');
  elsif draft.content_type='insight' then
    category_value:=p->>'category'; if category_value not in ('vocab','idiom','grammar_note','pronunciation') then raise exception 'invalid_insight_category'; end if;
    if nullif(trim(p->>'raw_snippet'),'') is null then raise exception 'invalid_insight'; end if;
    level_value:=p->>'level'; if level_value not in ('A1','A2','B1','B2','C1') then raise exception 'invalid_level'; end if;
    insert into extracted_insights(user_id,lesson_id,category,raw_snippet,ai_expanded_explanation,ai_example,estimated_level,reviewed) values(uid,draft.lesson_id,category_value::insight_category,trim(p->>'raw_snippet'),nullif(p->>'explanation',''),nullif(p->>'example',''),level_value::level_code,true);
  elsif draft.content_type='exercise' then
    target_pattern:=lower(trim(p->>'pattern_structure_en')); if target_pattern='' then raise exception 'invalid_exercise_pattern'; end if;
    select id into pattern_id_value from patterns where user_id=uid and lesson_id=draft.lesson_id and lower(trim(grammar_structure_en))=target_pattern order by order_index,created_at limit 1;
    if pattern_id_value is null then raise exception 'pattern_must_be_approved_first'; end if;
    if nullif(trim(p->>'prompt_fa'),'') is null or nullif(trim(p->>'answer_en'),'') is null then raise exception 'invalid_exercise'; end if;
    select coalesce(max(order_index),-1)+1 into next_order from drill_items where user_id=uid and pattern_id=pattern_id_value;
    insert into drill_items(user_id,pattern_id,sentence_fa,sentence_en,order_index) values(uid,pattern_id_value,trim(p->>'prompt_fa'),trim(p->>'answer_en'),next_order);
  else raise exception 'unsupported_content_type'; end if;
  update ai_content_drafts set status='approved',reviewed_at=now() where id=draft.id and user_id=uid and status='pending' returning * into result_draft;
  if result_draft.id is null then raise exception 'draft_state_changed'; end if;
  return result_draft;
end; $$;

grant execute on function publish_ai_content_draft(uuid) to authenticated;
