-- =============================================
-- AUTO-GENERATE SESSION CODE TRIGGER
-- =============================================
-- Automatically generates a unique session code when creating a new session

create or replace function public.trigger_generate_session_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.session_code is null or new.session_code = '' then
    loop
      new.session_code := public.generate_session_code();
      exit when not exists (
        select 1
        from public.live_sessions
        where session_code = new.session_code
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists live_sessions_generate_code_trigger
on public.live_sessions;

create trigger live_sessions_generate_code_trigger
  before insert on public.live_sessions
  for each row
  execute function public.trigger_generate_session_code();

comment on function public.trigger_generate_session_code
is 'Trigger function to auto-generate unique session codes';
