create or replace function cleanup_file_variants()
returns trigger
set search_path = ''
language plpgsql
security definer
as $$
begin
  -- Delete all variant files when original is deleted
  delete from storage.objects
  where bucket_id = 'files'
    and name ~ ('^' || regexp_replace(old.path, '\.[^.]+$', '') || '_(?:small|medium|thumb)\.');
  
  return old;
end;
$$;

create trigger trigger_cleanup_file_variants
  after delete on public.file_library
  for each row
  execute function cleanup_file_variants();
