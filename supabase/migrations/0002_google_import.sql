-- Google Forms import: remember where a form came from and how to submit answers back.
alter table public.forms
  add column if not exists source text not null default 'native' check (source in ('native','google')),
  add column if not exists google_form_id text,
  add column if not exists google_page_count integer not null default 1;

alter table public.questions
  add column if not exists google_entry_id text;
