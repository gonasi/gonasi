-- ====================================================================================
-- triggers
-- ====================================================================================

create or replace function public.set_lesson_block_position()
returns trigger
as $$
begin
  if new.position is null or new.position = 0 then
    select coalesce(max(position), 0) + 1
    into new.position
    from public.lesson_blocks
    where lesson_id = new.lesson_id;
  end if;
  return new;
end;
$$
language plpgsql
set search_path = '';

create trigger trg_set_lesson_block_position
before insert on public.lesson_blocks
for each row
execute function set_lesson_block_position();


-- ====================================================================================
-- function: reorder_lesson_blocks
-- purpose: update lesson block positions in bulk from a jsonb array of blocks
-- note: shifts existing positions temporarily to avoid conflicts, then upserts new positions
-- ====================================================================================
create or replace function reorder_lesson_blocks(blocks jsonb)
returns void
language plpgsql
security definer
set search_path = '' -- prevent search_path injection
as $$
declare
  target_course_id uuid;
  target_lesson_id uuid;
begin
  -- extract course_id and lesson_id from first block in the jsonb array
  target_course_id := (blocks->0->>'course_id')::uuid;
  target_lesson_id := (blocks->0->>'lesson_id')::uuid;

  -- temporarily shift all existing positions for this course and lesson to avoid conflicts
  update public.lesson_blocks
  set position = position + 1000000
  where course_id = target_course_id
    and lesson_id = target_lesson_id;

  -- upsert new block positions from provided jsonb array
  insert into public.lesson_blocks (
    id, course_id, lesson_id, plugin_type, position, content, settings, created_by, updated_by
  )
  select
    (b->>'id')::uuid,
    (b->>'course_id')::uuid,
    (b->>'lesson_id')::uuid,
    b->>'plugin_type',
    (b->>'position')::int,
    coalesce(b->'content', '{}'::jsonb),
    coalesce(b->'settings', '{}'::jsonb),
    (b->>'created_by')::uuid,
    (b->>'updated_by')::uuid
  from jsonb_array_elements(blocks) as b
  on conflict (id) do update
  set
    position = excluded.position,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now());
end;
$$;


-- ====================================================================================
-- FUNCTION: increment_lesson_block_version
-- PURPOSE: Automatically increments the content_version of a lesson_block when
--          its content, settings, or plugin_type changes
-- ====================================================================================
create or replace function public.increment_lesson_block_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if content/settings/plugin_type changed
  if TG_OP = 'UPDATE' and (
    NEW.content is distinct from OLD.content or
    NEW.settings is distinct from OLD.settings or
    NEW.plugin_type is distinct from OLD.plugin_type
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Increment lesson block version on content changes
-- ====================================================================================
create trigger trg_increment_lesson_block_version
  before update on public.lesson_blocks
  for each row
  execute function public.increment_lesson_block_version();


-- ====================================================================================
-- FUNCTION: increment_lesson_version
-- PURPOSE: Automatically increments the content_version of a lesson when
--          its settings change
-- ====================================================================================
create or replace function public.increment_lesson_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if settings changed
  if TG_OP = 'UPDATE' and (
    NEW.settings is distinct from OLD.settings or
    NEW.name is distinct from OLD.name
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Increment lesson version on content changes
-- ====================================================================================
create trigger trg_increment_lesson_version
  before update on public.lessons
  for each row
  execute function public.increment_lesson_version();


-- ====================================================================================
-- FUNCTION: increment_chapter_version
-- PURPOSE: Automatically increments the content_version of a chapter when
--          its name or description changes
-- ====================================================================================
create or replace function public.increment_chapter_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if name/description changed
  if TG_OP = 'UPDATE' and (
    NEW.name is distinct from OLD.name or
    NEW.description is distinct from OLD.description
  ) then
    NEW.content_version := OLD.content_version + 1;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Increment chapter version on content changes
-- ====================================================================================
create trigger trg_increment_chapter_version
  before update on public.chapters
  for each row
  execute function public.increment_chapter_version();


-- ====================================================================================
-- FUNCTION: increment_pricing_tier_version
-- PURPOSE: Automatically increments the pricing_version of a pricing tier when
--          price, frequency, or promotional pricing changes
-- ====================================================================================
create or replace function public.increment_pricing_tier_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- On INSERT, always start with version 1 (default already set)
  if TG_OP = 'INSERT' then
    return NEW;
  end if;

  -- On UPDATE, only increment version if pricing-related fields changed
  if TG_OP = 'UPDATE' and (
    NEW.price is distinct from OLD.price or
    NEW.payment_frequency is distinct from OLD.payment_frequency or
    NEW.is_free is distinct from OLD.is_free or
    NEW.promotional_price is distinct from OLD.promotional_price or
    NEW.promotion_start_date is distinct from OLD.promotion_start_date or
    NEW.promotion_end_date is distinct from OLD.promotion_end_date or
    NEW.is_active is distinct from OLD.is_active
  ) then
    NEW.pricing_version := OLD.pricing_version + 1;
  end if;

  return NEW;
end;
$$;

-- ====================================================================================
-- TRIGGER: Increment pricing tier version on pricing changes
-- ====================================================================================
create trigger trg_increment_pricing_tier_version
  before update on public.course_pricing_tiers
  for each row
  execute function public.increment_pricing_tier_version();
