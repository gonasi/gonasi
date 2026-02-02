-- =============================================
-- AUTO-GENERATE SESSION CODE TRIGGER
-- =============================================
-- Automatically generates a unique session code when creating a new session

create or replace function trigger_generate_session_code()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.session_code is null or new.session_code = '' then
    -- Generate unique code (retry if collision)
    loop
      new.session_code := generate_session_code();
      exit when not exists (
        select 1 from live_sessions where session_code = new.session_code
      );
    end loop;
  end if;
  return new;
end;
$$;

create trigger live_sessions_generate_code_trigger
  before insert on live_sessions
  for each row
  execute function trigger_generate_session_code();

comment on function trigger_generate_session_code is 'Trigger function to auto-generate unique session codes';
