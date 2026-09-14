# MK English Pro — deployment

## Cloudflare Pages
Set the GitHub-connected Cloudflare Pages project to:

- Root: `04-pwa-app`
- Build: `npm install && npm run build`
- Output: `dist`
- Node: 20+
- Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Pushes to the connected Git branch will trigger Cloudflare builds.

## Supabase
Apply `04-pwa-app/supabase/migrations/20260915010000_phase10_hardening.sql` to the Supabase project and deploy the Edge Functions under `04-pwa-app/supabase/functions/`. Cloudflare Pages does not execute Supabase migrations or deploy Supabase Edge Functions.
