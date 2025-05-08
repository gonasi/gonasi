-- ===========================
-- Table: lesson_progress
-- ===========================
create table public.lesson_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Relations
  user_id uuid not null,
  lesson_id uuid not null,

  -- Computed metrics
  progress_percentage numeric not null default 0,         -- 0–100
  weighted_average_score numeric,                         -- Nullable if no scored blocks
  total_time_spent_seconds integer not null default 0,
  is_complete boolean not null default false,

  -- Meta
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,

  unique (user_id, lesson_id),
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (lesson_id) references public.lessons(id) on delete cascade
);

-- ===========================
-- Function: update_lesson_progress()
-- ===========================
create or replace function public.update_lesson_progress()
returns trigger as $$
declare 
  total_weight numeric;
  completed_weight numeric;
  weighted_score_sum numeric;
  score_weight_sum numeric;
begin
  -- Compute total block weight for the lesson
  select coalesce(sum(weight), 0)
  into total_weight
  from public.blocks
  where lesson_id = coalesce(new.lesson_id, old.lesson_id);

  -- Compute completed weight and score aggregates
  select
    coalesce(sum(b.weight), 0),
    sum(b.weight * bi.score) filter (where bi.score is not null),
    sum(b.weight) filter (where bi.score is not null)
  into
    completed_weight,
    weighted_score_sum,
    score_weight_sum
  from public.block_interactions bi
  join public.blocks b on b.id = bi.block_id
  where bi.user_id = coalesce(new.user_id, old.user_id)
    and bi.lesson_id = coalesce(new.lesson_id, old.lesson_id)
    and bi.is_complete = true;

  -- Upsert computed progress
  insert into public.lesson_progress (
    user_id,
    lesson_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete
  )
  select
    coalesce(new.user_id, old.user_id),
    coalesce(new.lesson_id, old.lesson_id),
    case when total_weight > 0 then (completed_weight / total_weight) * 100 else 0 end,
    case when score_weight_sum > 0 then (weighted_score_sum / score_weight_sum) else null end,
    coalesce((
      select sum(time_spent_seconds)
      from public.block_interactions
      where user_id = coalesce(new.user_id, old.user_id)
        and lesson_id = coalesce(new.lesson_id, old.lesson_id)
    ), 0),
    completed_weight = total_weight and total_weight > 0
  on conflict (user_id, lesson_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    updated_at = current_timestamp;

  return null;
end;
$$ language plpgsql;

-- ===========================
-- Triggers: block_interactions
-- ===========================
create trigger trg_progress_on_block_insert
after insert on public.block_interactions
for each row
execute function public.update_lesson_progress();

create trigger trg_progress_on_block_update
after update on public.block_interactions
for each row
execute function public.update_lesson_progress();

create trigger trg_progress_on_block_delete
after delete on public.block_interactions
for each row
execute function public.update_lesson_progress();

-- ===========================
-- Triggers: blocks.weight update
-- ===========================
create or replace function public.trigger_lesson_progress_on_weight_change()
returns trigger as $$
begin
  -- For each user who has interacted with this block
  perform public.update_lesson_progress()
  from public.block_interactions bi
  where bi.block_id = new.id;

  return null;
end;
$$ language plpgsql;

create trigger trg_progress_on_block_weight_update
after update of weight on public.blocks
for each row
when (old.weight is distinct from new.weight)
execute function public.trigger_lesson_progress_on_weight_change();


create or replace function public.recalculate_lesson_progress(p_user_id uuid, p_lesson_id uuid)
returns void as $$
declare
  total_weight numeric;
  completed_weight numeric;
  weighted_score_sum numeric;
  score_weight_sum numeric;
begin
  select coalesce(sum(weight), 0)
  into total_weight
  from public.blocks
  where lesson_id = p_lesson_id;

  select
    coalesce(sum(b.weight), 0),
    sum(b.weight * bi.score) filter (where bi.score is not null),
    sum(b.weight) filter (where bi.score is not null)
  into
    completed_weight,
    weighted_score_sum,
    score_weight_sum
  from public.block_interactions bi
  join public.blocks b on b.id = bi.block_id
  where bi.user_id = p_user_id
    and bi.lesson_id = p_lesson_id
    and bi.is_complete = true;

  insert into public.lesson_progress (
    user_id,
    lesson_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete
  )
  select
    p_user_id,
    p_lesson_id,
    case when total_weight > 0 then (completed_weight / total_weight) * 100 else 0 end,
    case when score_weight_sum > 0 then (weighted_score_sum / score_weight_sum) else null end,
    coalesce((
      select sum(time_spent_seconds)
      from public.block_interactions
      where user_id = p_user_id and lesson_id = p_lesson_id
    ), 0),
    completed_weight = total_weight and total_weight > 0
  on conflict (user_id, lesson_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    updated_at = current_timestamp;
end;
$$ language plpgsql;


create or replace function public.update_lesson_progress()
returns trigger as $$
begin
  perform public.recalculate_lesson_progress(
    coalesce(new.user_id, old.user_id),
    coalesce(new.lesson_id, old.lesson_id)
  );
  return null;
end;
$$ language plpgsql;

create or replace function public.trigger_lesson_progress_on_weight_change()
returns trigger as $$
declare
  rec record;
begin
  for rec in
    select distinct user_id
    from public.block_interactions
    where block_id = new.id
  loop
    perform public.recalculate_lesson_progress(rec.user_id, new.lesson_id);
  end loop;

  return null;
end;
$$ language plpgsql;
