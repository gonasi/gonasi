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

export type ClearableTable = 'profiles' | 'user_roles';

const DEFAULT_TABLES_TO_CLEAR: ClearableTable[] = ['profiles', 'user_roles'];

// Centralized cleanup manager
export class TestCleanupManager {
  static async signOutAllClients() {
    try {
      await testSupabase.auth.signOut();
    } catch (error) {
      console.warn('Failed to sign out test client:', error);
    }
  }

  static async cleanupUsers() {
    try {
      const {
        data: { users },
        error,
      } = await testSupabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.warn('Failed to list users for cleanup:', error);
        return;
      }

      // Delete all users in parallel for better performance
      const deletePromises = users.map(async (user) => {
        try {
          await testSupabaseAdmin.auth.admin.deleteUser(user.id);
        } catch (error) {
          console.warn(`Failed to delete user ${user.id}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);
    } catch (error) {
      console.warn('Failed to cleanup auth users:', error);
    }
  }

  static async clearTables(tables: ClearableTable[] = DEFAULT_TABLES_TO_CLEAR) {
    // Clear tables in reverse order to handle dependencies
    for (const table of [...tables].reverse()) {
      try {
        await testSupabaseAdmin
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (error) {
        console.warn(`Failed to clear table ${table}:`, error);
      }
    }
  }

  // Main cleanup method that handles the complete reset
  static async performFullCleanup() {
    await this.signOutAllClients();
    await this.cleanupUsers();
    await this.clearTables();
  }
}

// User management utilities
export class TestUserManager {
  static async signInUser(email: string, password: string): Promise<SupabaseClient> {
    const client = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return client;
  }
}

// Database state management
export class DatabaseManager {
  static async resetDatabase() {
    await TestCleanupManager.performFullCleanup();
  }

  // TODO: Seed data when needed
  static async seedTestData() {}
}

// Test setup hooks
export function setupTestDatabase() {
  beforeAll(async () => {
    await TestCleanupManager.performFullCleanup();
    await DatabaseManager.seedTestData();
  });

  afterAll(async () => {
    await TestCleanupManager.performFullCleanup();
  });
}

export function signOutTestUsers() {
  afterEach(async () => {
    await TestCleanupManager.signOutAllClients();
  });
}
