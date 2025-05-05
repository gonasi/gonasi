-- Create the staff_invites table
create table public.staff_invites (
  id uuid default uuid_generate_v4() primary key not null,
  staff_id uuid null references public.profiles(id) on delete cascade, -- Nullable for new users
  company_id uuid not null references public.profiles(id) on delete cascade, -- Users are companies
  invite_token uuid unique not null,
  invited_email text null check (staff_id is not null or invited_email is not null), -- Ensure at least one is present
  invited_at timestamptz default timezone('utc', now()) not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '7 days'),
  is_confirmed boolean not null default false,
  confirmed_at timestamptz null, 
  last_resent_at timestamptz null, -- Tracks last time the invite was resent
  resend_count int default 0 not null, -- Tracks number of times invite has been resent
  unique (company_id, invited_email) -- Ensure invited email is unique per company
);

-- Add a table comment for documentation
comment on table public.staff_invites is 'All staff invites with tracking details.';
 
-- Ensure one active invite per user per company (allowing NULL staff_id)
create unique index IF NOT EXISTS unique_staff_invite_per_company 
on public.staff_invites (staff_id, company_id)
where staff_id is not null;

-- Ensure one invited email per company
create unique index IF NOT EXISTS unique_invited_email_per_company 
on public.staff_invites (company_id, invited_email)
where invited_email is not null;

-- Enable Row Level Security (RLS)
alter table public.staff_invites enable row level security;

-- Indexing for performance improvements
create index IF NOT EXISTS staff_invites_staff_id_idx on public.staff_invites (staff_id);
create index IF NOT EXISTS staff_invites_company_id_idx on public.staff_invites (company_id);
create unique index IF NOT EXISTS staff_invites_invite_token_idx on public.staff_invites (invite_token);

-- Policy: Allow invited users to view their own invite
create policy "allow invited user and company admins to view invites"
on public.staff_invites
for select
using (
  staff_id = (SELECT auth.uid())
  or invited_email = auth.email()
  or company_id in (
    select company_id
    from public.company_memberships
    where staff_id = (SELECT auth.uid())
    and staff_role in ('su', 'admin')
  )
);

-- Policy: Allow only superusers (su) and admins to create staff invites for their company
create policy "allow su and admin to create staff invites"
on public.staff_invites
for insert
with check (
  company_id = (
    select company_id
    from public.company_memberships
    where staff_id = (SELECT auth.uid())
    and staff_role in ('su', 'admin')
  )
);

-- Policy: Allow invited users to confirm their own invite but only update relevant fields
create policy "allow invited user to confirm their own invite"
on public.staff_invites
for update
using (
  staff_id = (SELECT auth.uid())
  or invited_email = auth.email()
)
with check (
  is_confirmed = true
  and confirmed_at is not null
);

-- Policy: Allow superusers (su) and admins to delete staff invites within their company,
-- and allow users to delete their own invite.
create policy "allow user to delete own invite and su/admin to delete within company"
on public.staff_invites
for delete
using (
  -- Allow superusers and admins to delete within their company
  company_id = (
    select company_id
    from public.company_memberships
    where staff_id = (SELECT auth.uid())
    and staff_role in ('su', 'admin')
  )
  -- Allow users to delete their own invite
  or staff_id = (SELECT auth.uid())
);

-- Allow only superusers (su) and admins to update last_resent_at and resend_count in their company
create policy "allow su and admin to update resend details"
on public.staff_invites
for update
using (
  company_id in (
    select company_id
    from public.company_memberships
    where staff_id = (SELECT auth.uid())
    and staff_role in ('su', 'admin')
  )
)
with check (
  resend_count >= 0
);

-- Function to accept staff invitations
CREATE OR REPLACE FUNCTION accept_staff_invitation(
  p_user_id UUID,
  p_invite_id UUID,
  p_company_id UUID
) RETURNS VOID AS $$
DECLARE
  v_created_by UUID;
BEGIN
  -- Retrieve the invited_by (created_by) from the invite
  SELECT invited_by INTO v_created_by
  FROM public.staff_invites
  WHERE id = p_invite_id;

  -- Mark the invitation as confirmed
  UPDATE public.staff_invites
  SET 
    is_confirmed = true,
    confirmed_at = now(),
    staff_id = p_user_id  -- Ensure the staff_id is set (for email invites)
  WHERE id = p_invite_id;
  
  -- Add the user to staff_members table if not already present, with created_by
  INSERT INTO public.staff_members (staff_id, company_id, staff_role, created_by)
  VALUES (p_user_id, p_company_id, 'user', v_created_by)
  ON CONFLICT (staff_id, company_id) DO NOTHING;
  
  -- Delete any other pending invitations for this user to this company
  DELETE FROM public.staff_invites
  WHERE 
    company_id = p_company_id AND 
    (staff_id = p_user_id OR invited_email IN (
      SELECT email FROM public.profiles WHERE id = p_user_id
    )) AND 
    id != p_invite_id AND
    is_confirmed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle deleting invites when a staff member is removed
CREATE OR REPLACE FUNCTION delete_invite_on_member_delete() 
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the invite corresponding to the deleted staff member from staff_invites
  DELETE FROM public.staff_invites
  WHERE staff_id = OLD.staff_id 
  AND company_id = OLD.company_id;
  
  -- Return the deleted row as the trigger function requires returning OLD for DELETE actions
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically delete invites when staff members are removed
CREATE TRIGGER trigger_delete_invite_on_member_delete
AFTER DELETE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION delete_invite_on_member_delete();