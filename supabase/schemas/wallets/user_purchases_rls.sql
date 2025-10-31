-- Enable Row Level Security
alter table public.user_purchases enable row level security;

-- Policy: Users can view their own purchases only
create policy "Users can view their own purchases"
on public.user_purchases
for select
to authenticated
using (
  (select auth.uid()) = user_id
);
