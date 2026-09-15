// Hand-maintained types matching mk_english_pro_schema.sql.
// For a always-in-sync alternative later, generate with:
//   supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts

export type LevelCode = "A1" | "A2" | "B1" | "B2" | "C1";
export type LessonStatus = "draft" | "published";
export type ProcessingStatus = "pending" | "processing" | "ready" | "error";
export type ProgressStatus = "locked" | "available" | "in_progress" | "completed";
export type InsightCategory = "vocab" | "idiom" | "grammar_note" | "pronunciation";


export interface Package { id: string; user_id: string; title: string; description: string | null; created_at: string; }
export interface Level { id: string; user_id: string; package_id: string; code: LevelCode; title: string; order_index: number; created_at: string; }
export interface Season { id: string; user_id: string; level_id: string; title: string; order_index: number; created_at: string; }
export interface Chapter { id: string; user_id: string; season_id: string; title: string; order_index: number; created_at: string; }

export interface Lesson {
  id: string;
  user_id: string;
  chapter_id: string;
  title: string;
  status: LessonStatus;
  pdf_storage_path: string | null;
  pdf_original_filename?: string | null;
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
  source: "pdf" | "audio_extracted" | "transcript_ai";
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
  source?: "pdf" | "audio_extracted" | "transcript_ai";
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


export type LearningEntityType = "grammar" | "pattern" | "vocabulary" | "insight";
export type PracticeResult = "correct" | "incorrect";

export interface PracticeAttempt {
  id: string;
  user_id: string;
  lesson_id: string | null;
  pattern_id: string | null;
  drill_item_id: string | null;
  result: PracticeResult;
  answer_text: string | null;
  reaction_latency_ms: number | null;
  grammar_score: number | null;
  pronunciation_score: number | null;
  created_at: string;
}

export interface LearnerMastery {
  id: string;
  user_id: string;
  entity_type: LearningEntityType;
  entity_id: string;
  mastery_score: number;
  exposure_count: number;
  successful_recall_count: number;
  failed_recall_count: number;
  last_practiced_at: string | null;
  next_review_at: string | null;
  last_session_id: string | null;
  updated_at: string;
}

export interface ReviewQueueItem {
  id: string;
  user_id: string;
  entity_type: LearningEntityType;
  entity_id: string;
  lesson_id: string | null;
  reason: string;
  due_at: string;
  priority: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonListeningProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  audio_source_id: string | null;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  last_played_at: string;
  updated_at: string;
}

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
    Functions: {
      save_lesson_listening_progress: {
        Args: {
          p_lesson_id: string;
          p_audio_source_id: string;
          p_position_seconds: number;
          p_duration_seconds: number | null;
          p_completed?: boolean;
        };
        Returns: LessonListeningProgress;
      };
      publish_ai_content_draft: {
        Args: { p_draft_id: string };
        Returns: AiContentDraft;
      };
    };
    Tables: {
      packages: { Row: Package; Insert: Partial<Package>; Update: Partial<Package> };
      levels: { Row: Level; Insert: Partial<Level>; Update: Partial<Level> };
      seasons: { Row: Season; Insert: Partial<Season>; Update: Partial<Season> };
      chapters: { Row: Chapter; Insert: Partial<Chapter>; Update: Partial<Chapter> };
      lessons: { Row: Lesson; Insert: Partial<Lesson>; Update: Partial<Lesson> };
      audio_sources: { Row: AudioSource; Insert: Partial<AudioSource>; Update: Partial<AudioSource> };
      patterns: { Row: Pattern; Insert: Partial<Pattern>; Update: Partial<Pattern> };
      drill_items: { Row: DrillItem; Insert: Partial<DrillItem>; Update: Partial<DrillItem> };
      vocabulary: { Row: VocabularyItem; Insert: Partial<VocabularyItem>; Update: Partial<VocabularyItem> };
      extracted_insights: { Row: ExtractedInsight; Insert: Partial<ExtractedInsight>; Update: Partial<ExtractedInsight> };
      lesson_progress: { Row: LessonProgress; Insert: Partial<LessonProgress>; Update: Partial<LessonProgress> };
      user_stats: { Row: UserStats; Insert: Partial<UserStats>; Update: Partial<UserStats> };
      practice_attempts: { Row: PracticeAttempt; Insert: Partial<PracticeAttempt>; Update: Partial<PracticeAttempt> };
      learner_mastery: { Row: LearnerMastery; Insert: Partial<LearnerMastery>; Update: Partial<LearnerMastery> };
      review_queue: { Row: ReviewQueueItem; Insert: Partial<ReviewQueueItem>; Update: Partial<ReviewQueueItem> };
      lesson_listening_progress: { Row: LessonListeningProgress; Insert: Partial<LessonListeningProgress>; Update: Partial<LessonListeningProgress> };
      voice_recordings: { Row: VoiceRecording; Insert: Partial<VoiceRecording>; Update: Partial<VoiceRecording> };
      lesson_transcripts: { Row: LessonTranscript; Insert: Partial<LessonTranscript>; Update: Partial<LessonTranscript> };
      ai_content_drafts: { Row: AiContentDraft; Insert: Partial<AiContentDraft>; Update: Partial<AiContentDraft> };
    };
  };
}

export type AiDraftStatus = "pending" | "approved" | "rejected";
export type AiContentType = "pattern" | "vocabulary" | "insight" | "exercise";
export interface LessonTranscript {
  id: string; user_id: string; lesson_id: string; source: string; language: string;
  full_text: string; status: ProcessingStatus; created_at: string; updated_at: string;
}
export interface AiContentDraft {
  id: string; user_id: string; lesson_id: string; transcript_id: string | null;
  content_type: AiContentType; title: string | null; payload: Record<string, unknown>;
  source_basis: string; status: AiDraftStatus; reviewed_at: string | null; created_at: string;
}
