-- MK English Pro — Phase 9: Transcript Intelligence & Study Material
-- Audio remains continuous. This layer only creates study material from transcript/PDF context.

do $$ begin
  alter type pattern_source add value 'transcript_ai';
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_draft_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists lesson_transcripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  source text not null default 'manual',
  language text not null default 'en',
  full_text text not null,
  status processing_status not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create table if not exists ai_content_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  transcript_id uuid references lesson_transcripts(id) on delete set null,
  content_type text not null check (content_type in ('pattern','vocabulary','insight','exercise')),
  title text,
  payload jsonb not null,
  source_basis text not null default 'transcript',
  status ai_draft_status not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_lesson_transcripts_lesson on lesson_transcripts(user_id, lesson_id);
create index if not exists idx_ai_content_drafts_lesson on ai_content_drafts(user_id, lesson_id, status);

alter table lesson_transcripts enable row level security;
alter table ai_content_drafts enable row level security;

drop policy if exists owner_all_lesson_transcripts on lesson_transcripts;
create policy owner_all_lesson_transcripts on lesson_transcripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists owner_all_ai_content_drafts on ai_content_drafts;
create policy owner_all_ai_content_drafts on ai_content_drafts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
