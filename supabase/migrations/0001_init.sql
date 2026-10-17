create extension if not exists pgcrypto;

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete cascade,
  is_published boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index forms_created_by_idx on public.forms(created_by);
create index forms_public_slug_idx on public.forms(public_slug);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in
    ('short_text','long_text','yes_no','multiple_choice','rating','number')),
  options jsonb,
  is_required boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index questions_form_id_idx on public.questions(form_id);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress','completed'))
);
create index sessions_form_id_idx on public.sessions(form_id);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  raw_transcript text,
  ai_answer jsonb,
  confidence numeric,
  was_edited boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);
create index responses_session_id_idx on public.responses(session_id);
create index responses_question_id_idx on public.responses(question_id);

-- Row level security: creators manage only their own data.
-- Public/respondent endpoints use the service-role key server-side (bypasses RLS).
alter table public.forms enable row level security;
alter table public.questions enable row level security;
alter table public.sessions enable row level security;
alter table public.responses enable row level security;

create policy forms_owner on public.forms for all
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy questions_owner on public.questions for all
  using (exists (select 1 from public.forms f where f.id = form_id and f.created_by = auth.uid()))
  with check (exists (select 1 from public.forms f where f.id = form_id and f.created_by = auth.uid()));

create policy sessions_owner_read on public.sessions for select
  using (exists (select 1 from public.forms f where f.id = form_id and f.created_by = auth.uid()));

create policy responses_owner_read on public.responses for select
  using (exists (select 1 from public.sessions s join public.forms f on f.id = s.form_id
                 where s.id = session_id and f.created_by = auth.uid()));
