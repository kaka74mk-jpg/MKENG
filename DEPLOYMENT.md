# MK English Pro — deployment

## Cloudflare Pages

Use the GitHub-connected Cloudflare Pages project with these exact settings:

- Framework preset: **Vite**
- Root directory: **`04-pwa-app`**
- Build command: **`npm run build`**
- Build output directory: **`dist`**
- Node: **20+**
- Build comments: optional
- Environment variables already configured in Cloudflare:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

The root directory is important. Do not leave it blank for this repository, because the web app's `package.json` lives under `04-pwa-app/`.

A push to the connected Git branch will trigger a new Cloudflare Pages build.

## Supabase

Cloudflare Pages does not run Supabase database migrations or deploy Supabase Edge Functions.

Apply the migration:

`04-pwa-app/supabase/migrations/20260915010000_phase10_hardening.sql`

and deploy the Edge Functions under:

`04-pwa-app/supabase/functions/`

The AI Study Lab also requires `OPENAI_API_KEY` in the Supabase Edge Function environment. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`.
