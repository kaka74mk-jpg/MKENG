# Phase 9 — Transcript Intelligence & Study Material Generation

## Route

`/creator/lesson/:lessonId/study`

## Flow

1. Creator opens a Lesson in Creator Mode.
2. Clicks **Study Lab**.
3. Pastes the lesson transcript and saves it.
4. Clicks **Generate AI Drafts**.
5. Supabase Edge Function `ai-study-material` creates Draft rows.
6. Creator reviews each item.
7. Approve publishes it into the existing canonical content tables; Reject keeps it out.

## Important

This phase does not control audio playback. The normal classroom audio must remain continuous and authentic.

## Supabase setup

Run:

`02-database/09_phase9_transcript_intelligence.sql`

Deploy:

`supabase/functions/ai-study-material/index.ts`

Set:

- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`

## Future ingestion

A future STT/PDF extraction service can populate `lesson_transcripts` without changing the Study Lab or canonical publishing contract.
