# MK English Pro

Personal English practice app built with React, Vite, TypeScript and Supabase.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Do not commit `.env` or any Supabase service-role key.

## Local development

```bash
npm install
npm run dev
```

## Supabase

Deploy the SQL and Edge Functions in `supabase/` to your Supabase project as required by the project setup.
