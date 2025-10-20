drop trigger if exists "trg_set_file_type" on "public"."course_files";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_format_type_from_extension()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE TRIGGER trg_set_format_type BEFORE INSERT OR UPDATE ON public.course_files FOR EACH ROW EXECUTE FUNCTION set_format_type_from_extension();


