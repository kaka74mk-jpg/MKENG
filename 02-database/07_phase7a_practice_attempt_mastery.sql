-- MK English Pro — Phase 7A
-- Practice Attempt -> Mastery -> Review Queue
-- Safe to run after the baseline schema.

do $$ begin
  create type learning_entity_type as enum ('grammar', 'pattern', 'vocabulary', 'insight');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type practice_result as enum ('correct', 'incorrect');
exception when duplicate_object then null;
end $$;

create table if not exists practice_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  pattern_id uuid references patterns(id) on delete set null,
  drill_item_id uuid references drill_items(id) on delete set null,
  result practice_result not null,
  answer_text text,
  reaction_latency_ms int,
  grammar_score numeric,
  pronunciation_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists learner_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type learning_entity_type not null,
  entity_id uuid not null,
  mastery_score numeric not null default 0 check (mastery_score >= 0 and mastery_score <= 100),
  exposure_count int not null default 0,
  successful_recall_count int not null default 0,
  failed_recall_count int not null default 0,
  last_practiced_at timestamptz,
  next_review_at timestamptz,
  last_session_id uuid references lessons(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table if not exists review_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type learning_entity_type not null,
  entity_id uuid not null,
  lesson_id uuid references lessons(id) on delete set null,
  reason text not null default 'practice',
  due_at timestamptz not null,
  priority int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create index if not exists idx_practice_attempts_user_created
  on practice_attempts(user_id, created_at desc);
create index if not exists idx_practice_attempts_pattern
  on practice_attempts(user_id, pattern_id, created_at desc);
create index if not exists idx_learner_mastery_due
  on learner_mastery(user_id, next_review_at);
create index if not exists idx_review_queue_due
  on review_queue(user_id, due_at, priority desc);

alter table practice_attempts enable row level security;
alter table learner_mastery enable row level security;
alter table review_queue enable row level security;

drop policy if exists "practice_attempts_owner" on practice_attempts;
create policy "practice_attempts_owner" on practice_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "learner_mastery_owner" on learner_mastery;
create policy "learner_mastery_owner" on learner_mastery
  for select using (auth.uid() = user_id);

drop policy if exists "review_queue_owner" on review_queue;
create policy "review_queue_owner" on review_queue
  for select using (auth.uid() = user_id);

create or replace function record_learning_event(
  p_entity_type learning_entity_type,
  p_entity_id uuid,
  p_lesson_id uuid,
  p_result practice_result,
  p_attempt_id uuid default null
)
returns learner_mastery
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_mastery learner_mastery;
  v_new_score numeric;
  v_next_review timestamptz;
  v_priority int;
  v_reason text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_entity_id is null then
    raise exception 'entity_id_required';
  end if;

  select * into v_mastery
  from learner_mastery
  where user_id = v_user_id
    and entity_type = p_entity_type
    and entity_id = p_entity_id
  for update;

  if not found then
    v_mastery.id := uuid_generate_v4();
    v_mastery.user_id := v_user_id;
    v_mastery.entity_type := p_entity_type;
    v_mastery.entity_id := p_entity_id;
    v_mastery.mastery_score := 0;
    v_mastery.exposure_count := 0;
    v_mastery.successful_recall_count := 0;
    v_mastery.failed_recall_count := 0;
  end if;

  v_mastery.exposure_count := v_mastery.exposure_count + 1;
  v_mastery.last_practiced_at := now();
  v_mastery.last_session_id := p_lesson_id;

  if p_result = 'correct' then
    v_mastery.successful_recall_count := v_mastery.successful_recall_count + 1;
    v_new_score := least(100, greatest(0, v_mastery.mastery_score + (10 + (v_mastery.mastery_score * 0.04))));
    v_mastery.mastery_score := round(v_new_score, 2);

    if v_mastery.mastery_score >= 80 then
      v_next_review := now() + interval '21 days';
      v_priority := 10;
    elsif v_mastery.mastery_score >= 60 then
      v_next_review := now() + interval '7 days';
      v_priority := 20;
    elsif v_mastery.mastery_score >= 30 then
      v_next_review := now() + interval '3 days';
      v_priority := 30;
    else
      v_next_review := now() + interval '1 day';
      v_priority := 40;
    end if;
    v_reason := 'successful_practice';
  else
    v_mastery.failed_recall_count := v_mastery.failed_recall_count + 1;
    v_mastery.mastery_score := round(greatest(0, v_mastery.mastery_score - 12), 2);
    v_next_review := now() + interval '1 day';
    v_priority := 50;
    v_reason := 'failed_recall';
  end if;

  v_mastery.next_review_at := v_next_review;
  v_mastery.updated_at := now();

  insert into learner_mastery (
    id, user_id, entity_type, entity_id, mastery_score,
    exposure_count, successful_recall_count, failed_recall_count,
    last_practiced_at, next_review_at, last_session_id, updated_at
  ) values (
    v_mastery.id, v_mastery.user_id, v_mastery.entity_type, v_mastery.entity_id,
    v_mastery.mastery_score, v_mastery.exposure_count,
    v_mastery.successful_recall_count, v_mastery.failed_recall_count,
    v_mastery.last_practiced_at, v_mastery.next_review_at,
    v_mastery.last_session_id, v_mastery.updated_at
  )
  on conflict (user_id, entity_type, entity_id) do update set
    mastery_score = excluded.mastery_score,
    exposure_count = excluded.exposure_count,
    successful_recall_count = excluded.successful_recall_count,
    failed_recall_count = excluded.failed_recall_count,
    last_practiced_at = excluded.last_practiced_at,
    next_review_at = excluded.next_review_at,
    last_session_id = excluded.last_session_id,
    updated_at = excluded.updated_at
  returning * into v_mastery;

  insert into review_queue (
    user_id, entity_type, entity_id, lesson_id, reason, due_at, priority, completed_at, updated_at
  ) values (
    v_user_id, p_entity_type, p_entity_id, p_lesson_id, v_reason, v_next_review, v_priority, null, now()
  )
  on conflict (user_id, entity_type, entity_id) do update set
    lesson_id = excluded.lesson_id,
    reason = excluded.reason,
    due_at = excluded.due_at,
    priority = excluded.priority,
    completed_at = null,
    updated_at = now();

  return v_mastery;
end;
$$;

grant execute on function record_learning_event(learning_entity_type, uuid, uuid, practice_result, uuid) to authenticated;

create or replace function get_due_reviews(p_limit int default 20)
returns setof review_queue
language sql
security definer
set search_path = public
as $$
  select rq.*
  from review_queue rq
  where rq.user_id = auth.uid()
    and rq.completed_at is null
    and rq.due_at <= now()
  order by rq.priority desc, rq.due_at asc
  limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

grant execute on function get_due_reviews(int) to authenticated;

create or replace function complete_review_item(p_review_id uuid)
returns review_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item review_queue;
begin
  update review_queue
  set completed_at = now(), updated_at = now()
  where id = p_review_id and user_id = auth.uid()
  returning * into v_item;

  if not found then
    raise exception 'review_not_found';
  end if;
  return v_item;
end;
$$;

grant execute on function complete_review_item(uuid) to authenticated;
