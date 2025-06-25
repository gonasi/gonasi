import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Test database configuration
const TEST_SUPABASE_URL = 'http://127.0.0.1:54321';
const TEST_SUPABASE_ANON_KEY = 'http://127.0.0.1:54321';
const TEST_SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
export const testSupabaseAdmin = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY);

// user_roles, role_permissions, course_categories, course_sub_categories
// should be populated by migration code

export type ClearableTable = 'profiles' | 'user_roles';

const DEFAULT_TABLES_TO_CLEAR: ClearableTable[] = ['profiles', 'user_roles'];

export class TestUserManager {
  static async signInUser(email: string, password: string): Promise<SupabaseClient> {
    const client = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }

  static async cleanupUsers() {
    try {
      // Get all users from auth
      const {
        data: { users },
        error,
      } = await testSupabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.warn('Failed to list users for cleanup:', error);
        return;
      }

      // Delete all users
      for (const user of users) {
        try {
          await testSupabaseAdmin.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.warn(`Failed to delete user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup all auth users:', error);
    }
  }
}

// Database state management
export class DatabaseManager {
  static async resetDatabase() {
    // First cleanup all auth users
    await TestUserManager.cleanupUsers();

    // Then reset sequences and truncate tables in correct order
    const tables = DEFAULT_TABLES_TO_CLEAR;

    for (const table of tables.reverse()) {
      await testSupabaseAdmin
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  // TODO: Seed data when needed
  static async seedTestData() {}
}

// Global test setup
export function setupTestDatabase() {
  beforeAll(async () => {
    await DatabaseManager.resetDatabase();
    await DatabaseManager.seedTestData();
  });

  afterAll(async () => {
    // Sign out before cleanup to avoid auth conflicts
    await testSupabase.auth.signOut();
    await DatabaseManager.resetDatabase();
  });
}

export function signOutTestUsers() {
  afterEach(async () => {
    // Sign out all test clients after each test
    await testSupabase.auth.signOut();
  });
}
