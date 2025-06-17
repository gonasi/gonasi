create index idx_profiles_username on public.profiles(username) where username is not null;
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_country_code on public.profiles(country_code);
create index idx_profiles_created_at on public.profiles(created_at);
create index idx_profiles_onboarding_status 
  on public.profiles(is_onboarding_complete, account_verified);
create index idx_profiles_verified_users 
  on public.profiles(id) 
  where account_verified = true;
