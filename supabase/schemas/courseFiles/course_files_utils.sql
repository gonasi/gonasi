-- =======================================
-- file type + extension trigger function
-- =======================================

create or replace function public.set_format_type_from_extension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auto-extract format if not provided
  if new.format is null or new.format = '' then
    new.format := lower(substring(new.name from '\.([^\.]+)$'));
    if new.format is null then
      new.format := '';
    end if;
  end if;

  new.format := lower(new.format);

  -- set file type using schema-qualified function
  new.file_type := public.determine_file_type(new.format);

  return new;
end;
$$;