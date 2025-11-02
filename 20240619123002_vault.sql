-- ============================================================================
-- PROJECT URL
-- ============================================================================
select vault.create_secret(
  'http://host.docker.internal:54321',
  'project_url',
  'Base URL for the main project environment, used for API requests and redirects.'
);

-- ============================================================================
-- SUPABASE KEYS
-- ============================================================================
select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',  
  'publishable_key',
  'Service role key for backend operations'
);