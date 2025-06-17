import { createClient } from '@supabase/supabase-js';

import type { Database } from '../../schema';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);
