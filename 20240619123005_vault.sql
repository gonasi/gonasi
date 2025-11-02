-- ============================================================================
-- PROJECT URL
-- ============================================================================
select vault.create_secret(
  'http://127.0.0.1:54321',
  'project_url',
  'Base URL for the main project environment, used for API requests and redirects.'
);

-- ============================================================================
-- SUPABASE KEYS
-- ============================================================================
select vault.create_secret(
  'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  'publishable_key',
  'Supabase publishable key used for client-side operations and public API calls.'
);
