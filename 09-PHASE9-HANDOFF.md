# MK English Pro — Phase 9 Handoff

## Status
**Phase 9 / 10 — COMPLETE (implementation delivered; production AI deployment still requires the user's Supabase project).**

## Critical product decision
The original classroom audio is **never forced to stop or pause** by this phase.

Audio remains an authentic, continuous classroom experience. Transcript/AI is a separate study and consolidation layer.

Correct architecture:

`Original Audio → Continuous Playback`

`Transcript → AI Analysis → Draft Study Material → Human Review → Canonical Content → Practice/Mastery/Review`

Optional active speaking/recording and optional smart-pause drills belong to Phase 10 and must never become mandatory behavior of the main audio player.

## What Phase 9 added

### Database
Added `02-database/09_phase9_transcript_intelligence.sql` and mirrored it under `04-pwa-app/supabase/sql/`.

New tables:
- `lesson_transcripts` — one transcript per user/lesson, currently entered manually; designed as the canonical transcript text layer.
- `ai_content_drafts` — AI-generated study material waiting for human review.

New enum:
- `ai_draft_status`: `pending | approved | rejected`

New `pattern_source` value:
- `transcript_ai`

Both new tables use owner-only RLS via `auth.uid() = user_id`.

### AI pipeline
Added:
- `04-pwa-app/supabase/functions/ai-study-material/index.ts`

The Edge Function:
1. authenticates the caller;
2. verifies lesson + transcript ownership;
3. sends transcript context to the server-side OpenAI API;
4. requests structured JSON only;
5. creates Draft rows for:
   - Patterns
   - Vocabulary
   - Insights
   - Exercises
6. never publishes AI output directly into canonical lesson content.

Secrets:
- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`

### Creator / Study Lab
Added:
- `04-pwa-app/src/pages/StudyLab.tsx`
- route: `/creator/lesson/:lessonId/study`
- `Study Lab` link from each Creator lesson.

Study Lab flow:
1. paste/save transcript;
2. generate AI drafts;
3. inspect each draft;
4. Approve or Reject;
5. approved Pattern/Vocabulary/Insight is copied into canonical tables;
6. approved Exercise becomes a `drill_item` under its approved Pattern.

This implements the intended **AI Draft → Human Approval → Canonical Content** rule.

## What is intentionally NOT included
- no automatic pause of the classroom audio;
- no mandatory sentence-by-sentence drill mode;
- no forced response windows;
- no voice recording;
- no pronunciation scoring;
- no forced alignment;
- no automatic Speech-to-Text provider yet;
- no automatic PDF parser yet;
- no production deployment test of the Edge Function.

## Important limitation
The current Phase 9 UI accepts a transcript manually. A future ingestion layer can populate `lesson_transcripts` from Speech-to-Text and/or a PDF-aware extraction pipeline without changing the study-material contract.

The existing PDF remains the formal lesson source. The transcript/audio layer is intended to enrich the lesson with real classroom language, implicit explanations, examples, vocabulary, and useful insights.

## Verification
The repository was patched from the Phase 8 archive. Dependency installation/build could not be completed in the sandbox because `npm install` timed out. Therefore this phase is code-complete at repository level but **not production-verified** against the user's live Supabase project.

## Exact next phase
**Phase 10 — Continuous Audio + Optional Active Practice**

Phase 10 should add optional:
- selected-sentence practice;
- voice recording;
- optional shadowing;
- optional smart-pause drill mode only when explicitly enabled;
- comparison/evaluation where evidence exists.

The default Listen experience must remain uninterrupted continuous classroom audio.
