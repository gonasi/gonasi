-- ===========================
-- Table: chapter_progress
-- ===========================
create table public.chapter_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Relations
  user_id uuid not null,
  chapter_id uuid not null,
  course_id uuid not null,

  -- Computed metrics
  progress_percentage numeric not null default 0,         -- 0–100
  weighted_average_score numeric,                         -- Nullable if no scored lessons
  total_time_spent_seconds integer not null default 0,
  is_complete boolean not null default false,
  completed_lessons_count integer not null default 0,
  total_lessons_count integer not null default 0,

  -- Meta
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,

  unique (user_id, chapter_id),
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (chapter_id) references public.chapters(id) on delete cascade,
  foreign key (course_id) references public.courses(id) on delete cascade
);

-- ===========================
-- Table: course_progress
-- ===========================
create table public.course_progress (
  id uuid primary key default uuid_generate_v4(),

  -- Relations
  user_id uuid not null,
  course_id uuid not null,

  -- Computed metrics
  progress_percentage numeric not null default 0,         -- 0–100
  weighted_average_score numeric,                         -- Nullable if no scored chapters
  total_time_spent_seconds integer not null default 0,
  is_complete boolean not null default false,
  completed_chapters_count integer not null default 0,
  total_chapters_count integer not null default 0,
  completed_lessons_count integer not null default 0,
  total_lessons_count integer not null default 0,

  -- Meta
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,

  unique (user_id, course_id),
  foreign key (user_id) references public.profiles(id) on delete cascade,
  foreign key (course_id) references public.courses(id) on delete cascade
);

-- ===========================
-- RLS Policies for chapter_progress
-- ===========================
alter table public.chapter_progress enable row level security;

-- Allow users to view their own progress
create policy "select own chapter progress only" on public.chapter_progress
  for select
  using (auth.uid() = user_id);

-- Allow automatic updates through functions
create policy "allow system updates to chapter progress" on public.chapter_progress
  for all
  using (true)
  with check (true);

-- ===========================
-- RLS Policies for course_progress
-- ===========================
alter table public.course_progress enable row level security;

-- Allow users to view their own progress
create policy "select own course progress only" on public.course_progress
  for select
  using (auth.uid() = user_id);

-- Allow automatic updates through functions
create policy "allow system updates to course progress" on public.course_progress
  for all
  using (true)
  with check (true);

-- ===========================
-- Function: update_chapter_progress()
-- ===========================
create or replace function public.update_chapter_progress(p_user_id uuid, p_chapter_id uuid)
returns void as $$
declare
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress_percentage numeric;
  v_weighted_score_sum numeric;
  v_score_weight_sum numeric;
  v_total_time_spent integer;
begin
  -- Get the course_id for this chapter
  select course_id into v_course_id
  from public.chapters
  where id = p_chapter_id;
  
  -- Count total lessons in the chapter
  select count(*) into v_total_lessons
  from public.lessons
  where chapter_id = p_chapter_id;
  
  -- Count completed lessons
  select count(*) into v_completed_lessons
  from public.lesson_progress
  where user_id = p_user_id
    and is_complete = true
    and lesson_id in (select id from public.lessons where chapter_id = p_chapter_id);
  
  -- Calculate progress percentage
  if v_total_lessons = 0 then
    v_progress_percentage := 0;
  else
    v_progress_percentage := (v_completed_lessons::numeric / v_total_lessons::numeric) * 100;
  end if;
  
  -- Calculate weighted average score
  select 
    sum(lp.weighted_average_score * lessons.position) filter (where lp.weighted_average_score is not null),
    sum(lessons.position) filter (where lp.weighted_average_score is not null)
  into v_weighted_score_sum, v_score_weight_sum
  from public.lesson_progress lp
  join public.lessons on lessons.id = lp.lesson_id
  where lp.user_id = p_user_id
    and lessons.chapter_id = p_chapter_id;
  
  -- Calculate total time spent
  select coalesce(sum(total_time_spent_seconds), 0) into v_total_time_spent
  from public.lesson_progress
  where user_id = p_user_id
    and lesson_id in (select id from public.lessons where chapter_id = p_chapter_id);
  
  -- Upsert chapter progress
  insert into public.chapter_progress (
    user_id,
    chapter_id,
    course_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete,
    completed_lessons_count,
    total_lessons_count
  ) values (
    p_user_id,
    p_chapter_id,
    v_course_id,
    v_progress_percentage,
    case when v_score_weight_sum > 0 then (v_weighted_score_sum / v_score_weight_sum) else null end,
    v_total_time_spent,
    v_progress_percentage = 100 and v_total_lessons > 0,
    v_completed_lessons,
    v_total_lessons
  )
  on conflict (user_id, chapter_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    completed_lessons_count = excluded.completed_lessons_count,
    total_lessons_count = excluded.total_lessons_count,
    updated_at = current_timestamp;
    
  -- Update course progress
  perform public.update_course_progress(p_user_id, v_course_id);
end;
$$ language plpgsql security definer;

-- ===========================
-- Function: update_course_progress()
-- ===========================
create or replace function public.update_course_progress(p_user_id uuid, p_course_id uuid)
returns void as $$
declare
  v_total_chapters integer;
  v_completed_chapters integer;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress_percentage numeric;
  v_weighted_score_sum numeric;
  v_score_weight_sum numeric;
  v_total_time_spent integer;
begin
  -- Count total chapters in the course
  select count(*) into v_total_chapters
  from public.chapters
  where course_id = p_course_id;
  
  -- Count completed chapters
  select count(*) into v_completed_chapters
  from public.chapter_progress
  where user_id = p_user_id
    and course_id = p_course_id
    and is_complete = true;
  
  -- Count total lessons in the course
  select count(*) into v_total_lessons
  from public.lessons
  where course_id = p_course_id;
  
  -- Count completed lessons
  select count(*) into v_completed_lessons
  from public.lesson_progress
  where user_id = p_user_id
    and is_complete = true
    and lesson_id in (select id from public.lessons where course_id = p_course_id);
  
  -- Calculate progress percentage
  if v_total_lessons = 0 then
    v_progress_percentage := 0;
  else
    v_progress_percentage := (v_completed_lessons::numeric / v_total_lessons::numeric) * 100;
  end if;
  
  -- Calculate weighted average score
  select 
    sum(cp.weighted_average_score * ch.position) filter (where cp.weighted_average_score is not null),
    sum(ch.position) filter (where cp.weighted_average_score is not null)
  into v_weighted_score_sum, v_score_weight_sum
  from public.chapter_progress cp
  join public.chapters ch on ch.id = cp.chapter_id
  where cp.user_id = p_user_id
    and cp.course_id = p_course_id;
  
  -- Calculate total time spent
  select coalesce(sum(total_time_spent_seconds), 0) into v_total_time_spent
  from public.chapter_progress
  where user_id = p_user_id
    and course_id = p_course_id;
  
  -- Upsert course progress
  insert into public.course_progress (
    user_id,
    course_id,
    progress_percentage,
    weighted_average_score,
    total_time_spent_seconds,
    is_complete,
    completed_chapters_count,
    total_chapters_count,
    completed_lessons_count,
    total_lessons_count
  ) values (
    p_user_id,
    p_course_id,
    v_progress_percentage,
    case when v_score_weight_sum > 0 then (v_weighted_score_sum / v_score_weight_sum) else null end,
    v_total_time_spent,
    v_progress_percentage = 100 and v_total_lessons > 0,
    v_completed_chapters,
    v_total_chapters,
    v_completed_lessons,
    v_total_lessons
  )
  on conflict (user_id, course_id) do update set
    progress_percentage = excluded.progress_percentage,
    weighted_average_score = excluded.weighted_average_score,
    total_time_spent_seconds = excluded.total_time_spent_seconds,
    is_complete = excluded.is_complete,
    completed_chapters_count = excluded.completed_chapters_count,
    total_chapters_count = excluded.total_chapters_count,
    completed_lessons_count = excluded.completed_lessons_count,
    total_lessons_count = excluded.total_lessons_count,
    updated_at = current_timestamp;
end;
$$ language plpgsql security definer;

-- ===========================
-- Trigger: lesson_progress changes
-- ===========================
create or replace function public.trigger_chapter_progress_on_lesson_update()
returns trigger as $$
declare
  v_chapter_id uuid;
begin
  -- Get the chapter ID for this lesson
  select chapter_id into v_chapter_id
  from public.lessons
  where id = coalesce(new.lesson_id, old.lesson_id);
  
  -- Update chapter progress
  perform public.update_chapter_progress(
    coalesce(new.user_id, old.user_id),
    v_chapter_id
  );
  
  return null;
end;
$$ language plpgsql;

create trigger trg_update_chapter_progress
after insert or update or delete on public.lesson_progress
for each row
execute function public.trigger_chapter_progress_on_lesson_update();

-- ===========================
-- Trigger: chapter structure changes
-- ===========================
create or replace function public.trigger_progress_on_lesson_structure_change()
returns trigger as $$
declare
  user_row record;
begin
  -- For each user who has progress in the affected chapter
  for user_row in
    select distinct user_id
    from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id
    where l.chapter_id = coalesce(new.chapter_id, old.chapter_id)
  loop
    -- Update the chapter progress
    perform public.update_chapter_progress(
      user_row.user_id,
      coalesce(new.chapter_id, old.chapter_id)
    );
  end loop;
  
  return null;
end;
$$ language plpgsql;

create trigger trg_update_on_lesson_change
after insert or update or delete on public.lessons
for each row
execute function public.trigger_progress_on_lesson_structure_change();

-- ===========================
-- Trigger: course structure changes
-- ===========================
create or replace function public.trigger_progress_on_chapter_structure_change()
returns trigger as $$
declare
  user_row record;
begin
  -- For each user who has progress in the affected course
  for user_row in
    select distinct user_id
    from public.chapter_progress
    where course_id = coalesce(new.course_id, old.course_id)
  loop
    -- Update the course progress
    perform public.update_course_progress(
      user_row.user_id,
      coalesce(new.course_id, old.course_id)
    );
  end loop;
  
  return null;
end;
$$ language plpgsql;

create trigger trg_update_on_chapter_change
after insert or update or delete on public.chapters
for each row
execute function public.trigger_progress_on_chapter_structure_change();

-- ===========================
-- Function: Recalculate all course progress for a user
-- ===========================
create or replace function public.recalculate_all_course_progress(p_user_id uuid)
returns void as $$
declare
  chapter_row record;
  course_row record;
begin
  -- First update chapter progress for all chapters the user has interaction with
  for chapter_row in
    select distinct c.id as chapter_id
    from public.lessons l
    join public.chapters c on c.id = l.chapter_id
    join public.lesson_progress lp on lp.lesson_id = l.id
    where lp.user_id = p_user_id
  loop
    perform public.update_chapter_progress(p_user_id, chapter_row.chapter_id);
  end loop;
  
  -- Then update course progress for all courses the user has interaction with
  for course_row in
    select distinct cp.course_id
    from public.chapter_progress cp
    where cp.user_id = p_user_id
  loop
    perform public.update_course_progress(p_user_id, course_row.course_id);
  end loop;
end;
$$ language plpgsql security definer;

-- ===========================
-- Helper function: Get course completion status
-- ===========================
create or replace function public.get_course_completion_status(p_user_id uuid, p_course_id uuid)
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'course_id', cp.course_id,
    'progress_percentage', cp.progress_percentage,
    'is_complete', cp.is_complete,
    'completed_chapters_count', cp.completed_chapters_count,
    'total_chapters_count', cp.total_chapters_count,
    'completed_lessons_count', cp.completed_lessons_count,
    'total_lessons_count', cp.total_lessons_count,
    'total_time_spent_seconds', cp.total_time_spent_seconds,
    'weighted_average_score', cp.weighted_average_score,
    'chapters', (
      select jsonb_agg(
        jsonb_build_object(
          'chapter_id', chp.chapter_id,
          'progress_percentage', chp.progress_percentage,
          'is_complete', chp.is_complete,
          'completed_lessons_count', chp.completed_lessons_count,
          'total_lessons_count', chp.total_lessons_count
        )
      )
      from public.chapter_progress chp
      where chp.user_id = p_user_id and chp.course_id = p_course_id
    )
  ) into result
  from public.course_progress cp
  where cp.user_id = p_user_id and cp.course_id = p_course_id;
  
  return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql;

-- ===========================
-- Indexes
-- ===========================
create index idx_chapter_progress_user on public.chapter_progress(user_id);
create index idx_chapter_progress_chapter on public.chapter_progress(chapter_id);
create index idx_chapter_progress_course on public.chapter_progress(course_id);
create index idx_chapter_progress_complete on public.chapter_progress(is_complete);
create index idx_chapter_progress_user_course on public.chapter_progress(user_id, course_id);

create index idx_course_progress_user on public.course_progress(user_id);
create index idx_course_progress_course on public.course_progress(course_id);
create index idx_course_progress_complete on public.course_progress(is_complete);