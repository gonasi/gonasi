-- create the feedback table
create table public.feedback (
  id uuid default uuid_generate_v4() primary key not null,

  experience text not null check (experience in ('Loved it', 'It was okay', 'I struggled')),
  hardest_part text not null check (char_length(hardest_part) between 3 and 500),
  best_part text not null check (char_length(best_part) between 3 and 500),
  nps_score int not null check (nps_score between 0 and 10),
  share_feedback text not null check (share_feedback in ('Yes', 'No')),
  email text check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or email = ''),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  created_by uuid null references public.profiles on delete cascade,
  updated_by uuid null references public.profiles on delete set null
);

comment on table public.feedback is 'User-submitted feedback from learning pathways';
comment on column public.feedback.experience is 'User’s summary of their experience';
comment on column public.feedback.hardest_part is 'What the user struggled with the most';
comment on column public.feedback.best_part is 'What the user enjoyed the most';
comment on column public.feedback.nps_score is 'Net Promoter Score (0-10)';
comment on column public.feedback.share_feedback is 'Whether the user agrees to share their feedback publicly';
comment on column public.feedback.email is 'Optional email address for follow-up';
comment on column public.feedback.created_by is 'User who submitted the feedback (nullable)';
comment on column public.feedback.updated_by is 'User who last updated the feedback (nullable)';

-- create a trigger to invoke the function before each row update
create trigger set_updated_at
before update on public.feedback
for each row
execute function update_updated_at_column();
