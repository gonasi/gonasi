-- ===========================
-- Table: public.block_interactions
-- ===========================
create table public.block_interactions (
  id uuid primary key default uuid_generate_v4(),

  -- Relations
  user_id uuid not null,                                  -- User who interacted with the block
  block_id uuid not null,                                 -- References the specific block
  lesson_id uuid not null,                                -- Denormalized for query performance

  -- Interaction state and evaluation
  is_complete boolean not null default false,             -- Whether the interaction is complete
  score numeric check (score >= 0 and score <= 100),      -- Optional score (0–100)
  attempts integer not null default 0 check (attempts >= 0),  -- Number of attempts

  -- Plugin-specific data
  state jsonb not null default '{}'::jsonb,               -- Plugin-managed state
  last_response jsonb not null default '{}'::jsonb,       -- Last user response
  feedback jsonb not null default '{}'::jsonb,            -- Feedback to the user

  -- Timing data
  started_at timestamptz,                                 -- When interaction started
  completed_at timestamptz,                               -- When interaction completed
  time_spent_seconds integer default 0 check (time_spent_seconds >= 0),  -- Time spent in seconds

  -- Meta
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,

  -- Constraints
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (block_id) references public.blocks(id) on delete cascade,
  foreign key (lesson_id) references public.lessons(id) on delete cascade,
  unique (user_id, block_id),
  check (
    (is_complete = true and completed_at is not null)
    or (is_complete = false)
  )
);

-- ===========================
-- Trigger: Auto-update updated_at
-- ===========================
create trigger set_updated_at_on_block_interactions
before update on public.block_interactions
for each row
execute function public.update_updated_at_column();

-- ===========================
-- Indexes
-- ===========================
create index idx_block_interactions_user on public.block_interactions(user_id);
create index idx_block_interactions_block on public.block_interactions(block_id);
create index idx_block_interactions_lesson on public.block_interactions(lesson_id);
create index idx_block_interactions_complete on public.block_interactions(is_complete);
create index idx_block_interactions_user_lesson on public.block_interactions(user_id, lesson_id);
create index idx_block_interactions_user_completed
  on public.block_interactions(user_id)
  where is_complete = true;

-- ===========================
-- Row-Level Security (RLS)
-- ===========================
alter table public.block_interactions enable row level security;

-- Allow insert if user is the one interacting
create policy "allow insert if user matches" on public.block_interactions
  for insert
  with check (auth.uid() = user_id);

-- Allow update if user owns the interaction
create policy "allow update if user matches" on public.block_interactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow delete if user owns the interaction
create policy "allow delete if user matches" on public.block_interactions
  for delete
  using (auth.uid() = user_id);

-- Allow select only for user’s own records
create policy "select own interactions only" on public.block_interactions
  for select
  using (auth.uid() = user_id);
