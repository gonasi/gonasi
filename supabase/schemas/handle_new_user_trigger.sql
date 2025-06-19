-- Trigger function: Automatically called when a new user is created in auth.users.
-- Purpose: Initializes the user's profile, assigns a role based on email, and handles errors gracefully.
-- Create trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Insert into profile
  begin
    insert into public.profiles (
      id, username, email, full_name, avatar_url, email_verified
    )
    values (
      new.id,
      new.raw_user_meta_data->>'username',
      new.email,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name'
      ),
      new.raw_user_meta_data->>'avatar_url',
      new.email_confirmed_at is not null
    );
  exception
    when others then
      raise notice 'Error inserting profile for user %: %', new.id, sqlerrm;
      raise;
  end;

  -- Assign role
  begin
    if new.email = 'gonasiapp@gmail.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_su');
    elsif new.email ilike '%@gonasi.com' then
      insert into public.user_roles (user_id, role) values (new.id, 'go_staff');
    else
      insert into public.user_roles (user_id, role) values (new.id, 'user');
    end if;
  exception
    when others then
      raise notice 'Error assigning role for user %: %', new.id, sqlerrm;
      raise;
  end;

  return null;
end;
$$;

-- Create trigger on auth.users
create or replace trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
