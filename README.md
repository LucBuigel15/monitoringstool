
create or replace view public.responses_stats as
select
  count(*) as total_responses,
  count(distinct submission_uuid) as total_submissions
from public.responses;




-- =========================
-- Supabase schema (idempotent & order-safe)
-- Dit script is veilig om meerdere keren te draaien en voert conditionele
-- migraties uit als onderdelen ontbreken.
-- =========================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums (veilig aanmaken)
do $$ begin
  create type priority_level as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_status as enum ('active','inactive','archived');
exception when duplicate_object then null; end $$;

-- Updated_at trigger function (replace is safe)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Questions table (maak of laat bestaan)
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

-- Indexes for questions (maak indexes die niet afhankelijk zijn van conditionele kolommen)
create index if not exists idx_questions_uuid
  on public.questions (uuid);

create index if not exists idx_questions_category
  on public.questions (category);

create index if not exists idx_questions_status
  on public.questions (status);

create index if not exists idx_questions_priority
  on public.questions (priority);

create index if not exists idx_questions_created_at
  on public.questions (created_at);

-- Maak/refresh trigger (drop+create is safe)
drop trigger if exists set_timestamp on public.questions;
create trigger set_timestamp
before update on public.questions
for each row execute procedure set_updated_at();

-- Veilige migratie: als de kolom `mode` nog niet bestaat, voeg toe en maak index.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'mode'
  ) then
    alter table public.questions
      add column mode varchar(50) not null default 'regular';
  end if;

  -- Maak de index alleen als de kolom bestaat (dit voorkomt errors bij vage migratie-states)
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'mode'
  ) then
    execute 'create index if not exists idx_questions_mode on public.questions (mode)';
  end if;
end $$;


-- Responses table
create table if not exists public.responses (
  uuid uuid primary key default gen_random_uuid(),
  question_uuid uuid not null references public.questions(uuid) on delete cascade,
  response_data jsonb not null,
  user_identifier text,
  submission_uuid uuid
);

-- MIGRATIE: voeg submission_uuid toe als kolom mist (idempotent)
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'responses'
      and column_name = 'submission_uuid'
  ) then
    alter table public.responses add column submission_uuid uuid;
  end if;
end $$;

-- MIGRATIE: verwijder created_at als die per ongeluk bestaat (wij gebruiken submissions.created_at)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'responses'
      and column_name = 'created_at'
  ) then
    drop index if exists responses_created_at_idx;
    alter table public.responses drop column created_at;
  end if;
end $$;

-- Indexen voor responses
create index if not exists responses_question_uuid_idx on public.responses (question_uuid);
create index if not exists idx_responses_submission_uuid on public.responses (submission_uuid);


ALTER TABLE public.responses 
ADD COLUMN IF NOT EXISTS survey_type varchar(50) NOT NULL DEFAULT 'regular';

CREATE INDEX IF NOT EXISTS idx_responses_survey_type 
ON public.responses (survey_type);
UPDATE public.responses 
SET survey_type = 'regular' 
WHERE survey_type IS NULL OR survey_type = '';


-- Maak consent vraag aan als deze nog niet bestaat
do $$
declare
  consent_uuid uuid := '00000000-0000-0000-0000-000000000001';
begin
  if not exists (
    select 1 from public.questions where uuid = consent_uuid
  ) then
    insert into public.questions (
      uuid,
      title,
      description,
      category,
      priority,
      status,
      mode,
      created_at,
      updated_at
    ) values (
      consent_uuid,
      'Geven de ouders/verzorgers toestemming voor het invullen van deze vragenlijst?',
      'Selecteer hieronder uw antwoord',
      'consent',
      'high',
      'active',
      'regular',
      now(),
      now()
    );
  end if;
end $$;

-- ============================================================
-- NIEUWE TABEL: Submissions (Groepering van antwoorden)
-- ============================================================
create table if not exists public.submissions (
  uuid uuid primary key default gen_random_uuid(),
  survey_type varchar(50) default 'regular',
  created_at timestamptz default now()
);

-- 1. REPARATIE: Vul de submissions tabel met bestaande ID's uit responses
-- Dit zorgt ervoor dat oude data niet omvalt bij het leggen van de relatie
insert into public.submissions (uuid, survey_type, created_at)
select distinct submission_uuid, 'regular', now()
from public.responses
where submission_uuid is not null
  and submission_uuid not in (select uuid from public.submissions);

-- 2. UPDATE: Herstel de juiste survey_type (bijv. 'ouder_kind') op basis van de antwoorden
-- Dit fixt de bug dat alles op 'regular' stond na de migratie
update public.submissions s
set survey_type = r.actual_type
from (
  select submission_uuid, max(survey_type) as actual_type
  from public.responses
  where survey_type is not null 
    and survey_type != ''
  group by submission_uuid
) r
where s.uuid = r.submission_uuid
  and s.survey_type != r.actual_type;

-- 3. RELATIE: Koppel responses hard aan submissions (Foreign Key)
do $$ begin
  -- Verwijder de constraint als hij al bestaat (voor veiligheid/updates)
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_name = 'fk_responses_submission'
  ) then
    alter table public.responses drop constraint fk_responses_submission;
  end if;

  -- Voeg de constraint toe
  alter table public.responses
    add constraint fk_responses_submission
    foreign key (submission_uuid)
    references public.submissions(uuid)
    on delete cascade;
end $$;

-- Voeg locatie kolom toe aan submissions tabel
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS location varchar(100);

-- (Optioneel) Index voor sneller zoeken op locatie later
CREATE INDEX IF NOT EXISTS idx_submissions_location 
ON public.submissions (location);
