-- =============================================
-- GENERATE UNIQUE SESSION CODE
-- =============================================
-- Generates a short, unique alphanumeric code for joining sessions
-- Excludes confusing characters (0, O, I, 1, etc.)

create or replace function generate_session_code()
returns text
language plpgsql
security definer
as $$
declare
  characters text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (0, O, I, 1)
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

comment on function generate_session_code is 'Generates a unique 6-character session code for joining live sessions';
