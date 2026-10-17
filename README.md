# VoiceForm AI (MVP)

Voice-first forms: speak → transcribe (OpenAI) → question-aware AI extraction → auto-filled field → confirm/edit/retry → submit.

## Setup
1. `npm install`
2. Create a Supabase project; run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
3. In Supabase Auth settings, disable "Confirm email" for quick local testing (optional).
4. `cp .env.example .env.local` and fill in the Supabase URL/anon key/service-role key and `OPENAI_API_KEY`.
5. `npm run dev` → http://localhost:3000

## Try it
Sign up at `/login` → Dashboard → **Add demo form** (creates and publishes "SaaS Customer Feedback") → **Open** → answer by voice (mic needs HTTPS or localhost) → submit → **Responses**.

## Layout
- `lib/ai/extract-answer.ts` – prompt + OpenAI chat call + strict validation (swap provider here)
- `lib/speech/transcribe.ts` – OpenAI speech-to-text (swap provider here)
- `lib/validation/` – zod schemas and per-type answer normalization (server-side source of truth)
- `lib/supabase/` – browser / cookie-bound (RLS) / service-role clients
- `app/api/**` – endpoints per the spec (+ `POST /api/forms/demo`)
- `components/voice-recorder`, `question-renderer`, `response-preview` (respondent flow), `form-builder`

## Security notes
Creator routes use Supabase Auth + RLS. Respondent endpoints use the service-role key server-side, only touch published forms / active sessions, and re-load question definitions from the DB. Audio is capped at 10 MB and never stored; transcripts are not logged.
