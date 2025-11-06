create table public.course_editors (
  id uuid primary key default uuid_generate_v4(),

  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  added_by uuid not null references public.profiles(id) on delete set null,
  added_at timestamptz not null default timezone('utc', now()),

  unique (course_id, user_id)
);

alter table public.course_editors
add constraint chk_editor_is_org_member
check (
  exists (
    select 1
    from public.courses c
    join public.organization_members m
      on m.organization_id = c.organization_id
      and m.user_id = user_id
    where c.id = course_id
  )
);


create index idx_course_editors_course_id 
  on public.course_editors (course_id);

create index idx_course_editors_user_id
  on public.course_editors (user_id); 