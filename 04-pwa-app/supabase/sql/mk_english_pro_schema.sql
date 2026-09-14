-- ============================================================
-- MK English Pro — Supabase Database Schema
-- Personal-use PWA (single owner, multi-device sync via Auth)
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------
create type level_code as enum ('A1', 'A2', 'B1', 'B2', 'C1');

create type lesson_status as enum ('draft', 'published');

create type audio_source_type as enum ('upload', 'google_drive_import', 'external_url');

create type processing_status as enum ('pending', 'processing', 'ready', 'error');

create type turn_type as enum (
  'drill_prompt',       -- Persian sentence from teacher
  'drill_pause',        -- silence / response window
  'drill_response',     -- recorded student response (from class audio)
  'teacher_explanation', -- free-form explanation
  'incidental_note'     -- side grammar/vocab note
);

create type pattern_source as enum ('pdf', 'audio_extracted');

create type insight_category as enum ('vocab', 'idiom', 'grammar_note', 'pronunciation');

create type level_flag as enum ('above_lesson_level', 'below_lesson_level', 'matched');

create type review_item_type as enum ('vocabulary', 'pattern', 'insight');

create type review_interval_stage as enum ('tomorrow', 'day_3', 'day_7', 'day_30', 'mastered');

create type review_result as enum ('correct', 'incorrect', 'skipped');

create type progress_status as enum ('locked', 'available', 'in_progress', 'completed');

create type note_reference_type as enum ('transcript_turn', 'drill_item', 'vocabulary', 'insight');

-- ============================================================
-- CONTENT HIERARCHY
-- Package → Level → Season → Chapter → Lesson
-- ============================================================

create table packages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table levels (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid not null references packages(id) on delete cascade,
  code level_code not null,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table seasons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level_id uuid not null references levels(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table chapters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season_id uuid not null references seasons(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references chapters(id) on delete cascade,
  title text not null,
  status lesson_status not null default 'draft',
  pdf_storage_path text,          -- path in Supabase Storage, if a session PDF exists
  pdf_original_filename text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AUDIO
-- ============================================================

create table audio_sources (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  source_type audio_source_type not null,
  original_drive_link text,             -- kept for reference only, not used for playback
  storage_path text,                    -- final Supabase Storage path (source of truth for playback)
  format text,                          -- mp3 / wav / m4a / ogg
  duration_seconds numeric,
  status processing_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now()
);

-- Raw turn-level segmentation output (diarization + classification)
create table transcript_turns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_source_id uuid not null references audio_sources(id) on delete cascade,
  turn_type turn_type not null,
  start_time numeric not null,          -- seconds
  end_time numeric not null,
  speaker_label text,                   -- e.g. 'teacher', 'student_1'
  text_fa text,
  text_en text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DRILL SYSTEM (Pattern + Drill Item)
-- ============================================================

create table patterns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  grammar_structure_fa text,
  grammar_structure_en text not null,
  example_fa text,
  example_en text,
  level level_code,
  source pattern_source not null default 'pdf',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table drill_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid not null references patterns(id) on delete cascade,
  sentence_fa text not null,
  sentence_en text not null,
  audio_prompt_start numeric,
  audio_prompt_end numeric,
  audio_pause_start numeric,
  audio_pause_end numeric,
  audio_response_start numeric,
  audio_response_end numeric,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- User's own recorded attempts at a drill item
create table voice_recordings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_item_id uuid not null references drill_items(id) on delete cascade,
  storage_path text not null,
  duration_seconds numeric,
  grammar_score numeric,        -- 0-100, from AI scoring
  pronunciation_score numeric,  -- 0-100, from AI scoring
  reaction_latency_ms int,      -- time from prompt end to user starting to speak
  created_at timestamptz not null default now()
);

-- ============================================================
-- VOCABULARY
-- ============================================================

create table vocabulary (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  word text not null,
  meaning text,
  pronunciation text,           -- IPA or phonetic
  example text,
  audio_storage_path text,
  level level_code,
  category text,                -- word / phrasal_verb / expression / useful_sentence
  source pattern_source not null default 'pdf',
  created_at timestamptz not null default now()
);

-- ============================================================
-- EXTRACTED INSIGHTS ("نکات پنهان این درس")
-- ============================================================

create table extracted_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  source_turn_id uuid references transcript_turns(id) on delete set null,
  source_timestamp numeric,     -- seconds into the audio, for jump-to-play
  category insight_category not null,
  raw_snippet text not null,
  ai_expanded_explanation text,
  ai_example text,
  estimated_level level_code,
  level_flag level_flag,
  reviewed boolean not null default false,  -- creator approved before publishing
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTES (free-form user notes on any content)
-- ============================================================

create table notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  reference_type note_reference_type not null,
  reference_id uuid not null,   -- id of transcript_turn / drill_item / vocabulary / insight
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROGRESS
-- ============================================================

create table lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status progress_status not null default 'locked',
  completion_percent numeric not null default 0,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create table pattern_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_id uuid not null references patterns(id) on delete cascade,
  mastery_score numeric not null default 0,        -- 0-100
  grammar_accuracy numeric not null default 0,      -- 0-100
  pronunciation_score_avg numeric not null default 0,
  reaction_latency_avg_ms int,
  attempts_count int not null default 0,
  last_practiced_at timestamptz,
  unique (user_id, pattern_id)
);

-- ============================================================
-- SPACED REPETITION REVIEWS
-- ============================================================

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type review_item_type not null,
  item_id uuid not null,        -- id of vocabulary / pattern / insight
  interval_stage review_interval_stage not null default 'tomorrow',
  next_review_at timestamptz not null,
  last_result review_result,
  streak_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- GAMIFICATION
-- ============================================================

create table user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  level_number int not null default 1,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  listening_seconds_total bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,           -- e.g. 'first_lesson', 'streak_7'
  title text not null,
  description text,
  unlocked_at timestamptz not null default now(),
  unique (user_id, code)
);

create table daily_challenges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  challenge_type text not null,     -- e.g. 'complete_drill_items', 'listening_minutes'
  target_value int not null,
  current_value int not null default 0,
  completed boolean not null default false,
  unique (user_id, challenge_date, challenge_type)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_levels_package on levels(package_id);
create index idx_seasons_level on seasons(level_id);
create index idx_chapters_season on chapters(season_id);
create index idx_lessons_chapter on lessons(chapter_id);
create index idx_audio_sources_lesson on audio_sources(lesson_id);
create index idx_transcript_turns_audio on transcript_turns(audio_source_id);
create index idx_patterns_lesson on patterns(lesson_id);
create index idx_drill_items_pattern on drill_items(pattern_id);
create index idx_vocabulary_lesson on vocabulary(lesson_id);
create index idx_insights_lesson on extracted_insights(lesson_id);
create index idx_notes_lesson on notes(lesson_id);
create index idx_reviews_next_review on reviews(user_id, next_review_at);
create index idx_progress_user on lesson_progress(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table: a user can only see/modify their own rows.
-- ============================================================

alter table packages enable row level security;
alter table levels enable row level security;
alter table seasons enable row level security;
alter table chapters enable row level security;
alter table lessons enable row level security;
alter table audio_sources enable row level security;
alter table transcript_turns enable row level security;
alter table patterns enable row level security;
alter table drill_items enable row level security;
alter table voice_recordings enable row level security;
alter table vocabulary enable row level security;
alter table extracted_insights enable row level security;
alter table notes enable row level security;
alter table lesson_progress enable row level security;
alter table pattern_mastery enable row level security;
alter table reviews enable row level security;
alter table user_stats enable row level security;
alter table achievements enable row level security;
alter table daily_challenges enable row level security;

-- One generic policy per table (owner-only access)
do $$
declare
  t text;
  tables text[] := array[
    'packages','levels','seasons','chapters','lessons',
    'audio_sources','transcript_turns','patterns','drill_items',
    'voice_recordings','vocabulary','extracted_insights','notes',
    'lesson_progress','pattern_mastery','reviews','user_stats',
    'achievements','daily_challenges'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy "owner_all_%1$s" on %1$s for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ============================================================
-- STORAGE BUCKETS (run once in Supabase Storage settings,
-- or via supabase-js / SQL if using the storage schema)
-- ============================================================
-- Buckets to create manually in Supabase dashboard:
--   'lesson-audio'   (private) — final audio files, migrated from Google Drive or uploaded
--   'lesson-pdfs'    (private) — session PDFs
--   'vocab-audio'    (private) — per-word pronunciation clips
--   'voice-recordings' (private) — user's own recorded attempts
-- Apply storage RLS policies scoping each object path to auth.uid(),
-- e.g. path convention: {user_id}/{lesson_id}/{filename}
