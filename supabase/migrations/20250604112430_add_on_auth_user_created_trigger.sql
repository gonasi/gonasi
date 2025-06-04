create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

comment on trigger on_auth_user_created on auth.users is 
  'Automatically creates profile and assigns role when a new user signs up via Supabase Auth';