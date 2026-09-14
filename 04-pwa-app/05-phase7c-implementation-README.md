# Phase 7C — AI Coach → Due Reviews

## Status
**Implemented**

The Coach is now a real PWA feature backed by a Supabase Edge Function. The browser never receives the AI provider secret.

## Flow

`Practice/Review data → Coach context → AI Coach → focused exercise/correction → learner response`

## Added

- `src/lib/aiCoach.ts`
- `src/pages/Coach.tsx`
- `/coach` route
- Supabase Edge Function `supabase/functions/ai-coach/index.ts`
- `08_phase7c_ai_coach.sql` context helper
- Weak-pattern and due-review context
- Lesson-aware coaching when `?lessonId=` is supplied
- Short corrective coaching prompt with one task at a time
- Graceful AI/provider failure handling

## Deployment

Set these Supabase Edge Function secrets:

- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`

Deploy `ai-coach` as a Supabase Edge Function. Do not put the provider key in `.env` for the Vite client.

## Scope

This phase deliberately does not claim voice, pronunciation scoring, automatic grammar scoring, or audio assessment. Those belong to later phases.
