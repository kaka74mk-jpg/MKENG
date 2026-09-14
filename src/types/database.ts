// Hand-maintained types matching mk_english_pro_schema.sql.
// For a always-in-sync alternative later, generate with:
//   supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts

export type LevelCode = "A1" | "A2" | "B1" | "B2" | "C1";
export type LessonStatus = "draft" | "published";
export type ProcessingStatus = "pending" | "processing" | "ready" | "error";
export type ProgressStatus = "locked" | "available" | "in_progress" | "completed";
export type InsightCategory = "vocab" | "idiom" | "grammar_note" | "pronunciation";

export interface Lesson {
  id: string;
  user_id: string;
  chapter_id: string;
  title: string;
  status: LessonStatus;
  pdf_storage_path: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface AudioSource {
  id: string;
  user_id: string;
  lesson_id: string;
  source_type: "upload" | "google_drive_import" | "external_url";
  original_drive_link: string | null;
  storage_path: string | null;
  format: string | null;
  duration_seconds: number | null;
  status: ProcessingStatus;
  error_message: string | null;
  created_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  lesson_id: string;
  grammar_structure_fa: string | null;
  grammar_structure_en: string;
  example_fa: string | null;
  example_en: string | null;
  level: LevelCode | null;
  source: "pdf" | "audio_extracted";
  order_index: number;
  created_at: string;
}

export interface DrillItem {
  id: string;
  user_id: string;
  pattern_id: string;
  sentence_fa: string;
  sentence_en: string;
  audio_prompt_start: number | null;
  audio_prompt_end: number | null;
  audio_pause_start: number | null;
  audio_pause_end: number | null;
  audio_response_start: number | null;
  audio_response_end: number | null;
  order_index: number;
  created_at: string;
}

export interface VocabularyItem {
  id: string;
  user_id: string;
  lesson_id: string;
  word: string;
  meaning: string | null;
  pronunciation: string | null;
  example: string | null;
  audio_storage_path: string | null;
  level: LevelCode | null;
  category: string | null;
  created_at: string;
}

export interface ExtractedInsight {
  id: string;
  user_id: string;
  lesson_id: string;
  source_turn_id: string | null;
  source_timestamp: number | null;
  category: InsightCategory;
  raw_snippet: string;
  ai_expanded_explanation: string | null;
  ai_example: string | null;
  estimated_level: LevelCode | null;
  reviewed: boolean;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: ProgressStatus;
  completion_percent: number;
  last_accessed_at: string | null;
  completed_at: string | null;
}

// Phase 3 — a user's own recorded attempt at a drill item, saved to the
// `voice-recordings` bucket at `{user_id}/{drill_item_id}/{timestamp}.webm`.
// grammar_score / pronunciation_score are filled in later by the (not yet
// built) AI scoring pipeline — until then they stay null.
export interface VoiceRecording {
  id: string;
  user_id: string;
  drill_item_id: string;
  storage_path: string;
  duration_seconds: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  reaction_latency_ms: number | null;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  xp: number;
  level_number: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  listening_seconds_total: number;
}

// Minimal Supabase Database generic shape — extend as more tables
// are wired into the UI.
export interface Database {
  public: {
    Tables: {
      lessons: { Row: Lesson; Insert: Partial<Lesson>; Update: Partial<Lesson> };
      audio_sources: { Row: AudioSource; Insert: Partial<AudioSource>; Update: Partial<AudioSource> };
      patterns: { Row: Pattern; Insert: Partial<Pattern>; Update: Partial<Pattern> };
      drill_items: { Row: DrillItem; Insert: Partial<DrillItem>; Update: Partial<DrillItem> };
      vocabulary: { Row: VocabularyItem; Insert: Partial<VocabularyItem>; Update: Partial<VocabularyItem> };
      extracted_insights: { Row: ExtractedInsight; Insert: Partial<ExtractedInsight>; Update: Partial<ExtractedInsight> };
      lesson_progress: { Row: LessonProgress; Insert: Partial<LessonProgress>; Update: Partial<LessonProgress> };
      voice_recordings: { Row: VoiceRecording; Insert: Partial<VoiceRecording>; Update: Partial<VoiceRecording> };
      user_stats: { Row: UserStats; Insert: Partial<UserStats>; Update: Partial<UserStats> };
    };
  };
}
