-- =========================
-- Supabase schema (idempotent & order-safe)
-- =========================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type priority_level as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_status as enum ('active','inactive','archived');
exception when duplicate_object then null; end $$;

-- Updated_at trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Questions table
create table if not exists public.questions (
  id bigserial primary key,
  uuid uuid not null unique default gen_random_uuid(),
  title varchar(500) not null,
  description text,
  category varchar(100),
  priority priority_level not null default 'medium',
  status question_status not null default 'active',
  mode varchar(50) not null default 'regular',
  created_by varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_questions_uuid on public.questions (uuid);
create index if not exists idx_questions_category on public.questions (category);
create index if not exists idx_questions_status on public.questions (status);
create index if not exists idx_questions_priority on public.questions (priority);
create index if not exists idx_questions_mode on public.questions (mode);

-- Trigger
drop trigger if exists set_timestamp on public.questions;
create trigger set_timestamp
before update on public.questions
for each row execute procedure set_updated_at();

-- Responses table
create table if not exists public.responses (
  uuid uuid primary key default gen_random_uuid(),
  question_uuid uuid not null references public.questions(uuid) on delete cascade,
  response_data jsonb not null,
  user_identifier text,
  submission_uuid uuid,
  survey_type varchar(50) default 'regular'
);

-- Indexes
create index if not exists responses_question_uuid_idx on public.responses (question_uuid);
create index if not exists idx_responses_submission_uuid on public.responses (submission_uuid);
create index if not exists idx_responses_survey_type on public.responses (survey_type);

-- Foreign Key
do $$ begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'fk_responses_submission') then
    alter table public.responses drop constraint fk_responses_submission;
  end if;
end $$;

alter table public.responses
  add constraint fk_responses_submission
  foreign key (submission_uuid)
  references public.submissions(uuid)
  on delete cascade;

-- Submissions table
create table if not exists public.submissions (
  uuid uuid primary key default gen_random_uuid(),
  survey_type varchar(50) default 'regular',
  location varchar(100),
  created_at timestamptz default now()
);

-- Consent question
do $$
declare consent_uuid uuid := '00000000-0000-0000-0000-000000000001';
begin
  if not exists (select 1 from public.questions where uuid = consent_uuid) then
    insert into public.questions (uuid, title, description, category, priority, status, mode, created_at, updated_at)
    values (
      consent_uuid,
      'Geven de ouders/verzorgers toestemming voor het invullen van deze vragenlijst?',
      'Selecteer hieronder uw antwoord',
      'consent', 'high', 'active', 'regular', now(), now()
    );
  end if;
end $$;