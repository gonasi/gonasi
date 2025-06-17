// Vitest lifecycle hooks
import { afterAll, beforeAll } from 'vitest';

// Import your initialized Supabase client
import { supabase } from './lib/supabase';

beforeAll(async () => {
  // Retrieve the current session from Supabase
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    // Log an error if there was an issue connecting to Supabase
    console.error('Error retrieving session from Supabase: ', error);
  } else {
    console.log('Supabase session retrieved:', data.session);
  }

  // Optionally, you can seed test data or sign in a test user here
  // await supabase.auth.signInWithPassword({ email, password });
});

afterAll(async () => {
  // Sign out the user after all tests to ensure clean state
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out from Supabase:', error);
  }

  // Optionally: truncate tables, clean test data, etc.
});
